/**
 * `e2eTest(...)` — the Playwright `test` for one app on its real stack.
 *
 * Per worker: its own database (a clone), its own Mailpit, and the built app server started with
 * that env. The same env boots the app graph a second time inside the Playwright worker, so a test
 * seeds data through the app's own services (`seed`) and signs users in (`actingAs`) without any
 * test-only route in the app.
 */
import { writeFile } from 'node:fs/promises';
import { test as base } from '@playwright/test';
import { orThrow } from '@arki/failure';
import { getLogger } from '@arki/log';
import { mailbox } from '../services/mailpit.js';
import { truncateAll } from '../services/postgres.js';
import { flushRedis } from '../services/redis.js';
import { expect } from '../ai/playwright.js';
import { readManifest } from '../stack/index.js';
import { serveWorker } from './server.js';
const log = getLogger('arki:testing:e2e');
export function e2eTest(options) {
    const cronSecretEnv = options.cronSecretEnv ?? 'CRON_SECRET';
    const test = base.extend({
        graph: [
            async ({ server }, use) => {
                // The graph reads its env when it is imported and booted, so the env goes in first.
                Object.assign(process.env, server.env);
                const loaded = await options.app();
                const booted = await loaded.boot();
                await use(booted.services);
                await booted.dispose();
            },
            { scope: 'worker' },
        ],
        server: [
            // eslint-disable-next-line no-empty-pattern -- Playwright reads a fixture's needs from the destructured first argument
            async ({}, use, workerInfo) => {
                await serveWorker({
                    stack: options.stack.attach(orThrow(readManifest())),
                    workerIndex: workerInfo.parallelIndex,
                    serve: options.serve,
                    use,
                });
            },
            { scope: 'worker' },
        ],
        seed: [async ({ graph }, use) => use(graph), { scope: 'worker' }],
        isolation: ['shared', { option: true }],
        freshWorker: [
            async ({ isolation, server, mailbox: box }, use, testInfo) => {
                if (isolation === 'fresh') {
                    const started = performance.now();
                    const database = urlOf(server.values, 'postgres');
                    const keys = urlOf(server.values, 'redis');
                    await Promise.all([
                        database === undefined ? undefined : truncateAll(database),
                        keys === undefined ? undefined : flushRedis(keys),
                        box.clear(),
                    ]);
                    const ms = Math.round(performance.now() - started);
                    log.debug('Fresh isolation of worker {worker} took {ms} ms', { worker: testInfo.parallelIndex, ms });
                    testInfo.annotations.push({ type: 'fresh-isolation', description: `${ms} ms` });
                }
                // eslint-disable-next-line unicorn/no-useless-undefined -- Playwright types a void fixture's `use` as taking one argument
                await use(undefined);
            },
            { auto: true },
        ],
        mailbox: [async ({ server }, use) => use(mailbox(server.values.mailpit.httpUrl)), { scope: 'worker' }],
        // A failed test carries what its server printed, which is where a 500 explains itself.
        serverLog: [
            async ({ server }, use, testInfo) => {
                // eslint-disable-next-line unicorn/no-useless-undefined -- Playwright types a void fixture's `use` as taking one argument
                await use(undefined);
                if (testInfo.status !== testInfo.expectedStatus) {
                    const path = testInfo.outputPath('server.log');
                    await writeFile(path, server.logs());
                    await testInfo.attach('server.log', { path });
                }
            },
            { auto: true },
        ],
        baseURL: async ({ server }, use) => use(server.url),
        factories: async ({ seed, freshWorker }, use) => {
            void freshWorker;
            await use(options.factories(seed));
        },
        cron: async ({ server, request, freshWorker }, use) => {
            void freshWorker;
            const secret = server.env[cronSecretEnv];
            if (secret === undefined)
                throw new Error(`CRON_SECRET_MISSING: the stack env must set ${cronSecretEnv}.`);
            await use({
                async run(name) {
                    const response = await request.post(`/api/cron/${name}`, { headers: { authorization: `Bearer ${secret}` }, timeout: 0 });
                    const text = await response.text();
                    const body = text === '' ? null : JSON.parse(text);
                    if (!response.ok())
                        throw new Error(`CRON_FAILED: ${name} answered ${response.status()}: ${text}`);
                    return { status: response.status(), body };
                },
            });
        },
        actingAs: async ({ seed, context, browser, mailbox: box, server, freshWorker }, use) => {
            void freshWorker;
            // The test's own browser context serves the first actor. A second actor needs a context of
            // their own, or their session cookie would replace the first one's.
            const extra = [];
            let actors = 0;
            await use(async (user) => {
                const email = (user?.email ?? `actor-${Math.random().toString(36).slice(2, 8)}@e2e.test`).toLowerCase();
                const signed = await options.auth(seed).testing.signIn({ email });
                const own = actors === 0 ? context : await browser.newContext({ baseURL: server.url });
                if (actors > 0)
                    extra.push(own);
                actors += 1;
                await addSessionCookie(own, signed.headers, server.url);
                const page = await own.newPage();
                return {
                    email,
                    user: signed.user,
                    page,
                    mail: {
                        waitFor: match => box.waitFor({ to: email, ...match }),
                        all: () => box.all(email),
                        clear: () => box.clear(email),
                    },
                };
            });
            for (const closing of extra)
                await closing.close();
        },
    });
    const story = storyFor(test);
    return { test, expect, story };
}
/** The `url` a service published for this worker, when the stack has that service. */
function urlOf(values, service) {
    const published = Reflect.get(values, service);
    if (typeof published !== 'object' || published === null)
        return undefined;
    const url = Reflect.get(published, 'url');
    return typeof url === 'string' ? url : undefined;
}
/** `name=value` from a `cookie` header, installed on the browser context for the server's host. */
async function addSessionCookie(context, headers, serverUrl) {
    const header = headers.get('cookie');
    if (header === null)
        throw new Error('SESSION_COOKIE_MISSING: auth.testing.signIn returned no cookie.');
    const cookies = header.split(';').map(part => {
        const at = part.indexOf('=');
        return { name: part.slice(0, at).trim(), value: part.slice(at + 1).trim(), url: serverUrl };
    });
    await context.addCookies(cookies);
}
/**
 * `story(id, title, body)` for any Playwright test, including one an app extended with its own
 * fixtures. The title starts with the id, so the report and the PRD agree.
 */
export function storyFor(test) {
    function story(id, title, detailsOrBody, maybeBody) {
        const [extraTag, body] = typeof detailsOrBody === 'function' ? [undefined, detailsOrBody] : [detailsOrBody.tag, maybeBody];
        if (body === undefined)
            throw new Error(`STORY_BODY_MISSING: story ${id} has no body.`);
        test(`${id}: ${title}`, { annotation: { type: 'story', description: id }, tag: extraTag === undefined ? ['@story'] : ['@story', extraTag] }, body);
    }
    return story;
}
//# sourceMappingURL=test.js.map