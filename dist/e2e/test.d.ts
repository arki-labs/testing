import type { Page, TestInfo } from '@playwright/test';
import type { TestType } from '@playwright/test';
import type { MailpitWorker, Mailbox, MailSummary, ReceivedMail } from '../services/mailpit.js';
import type { Json, ServiceSpec, Stack, WorkerValues } from '../stack/index.js';
import type { RunningServer, ServerOptions } from './server.js';
/** What a test needs from an app: boot the graph, read its services, dispose it. */
export type BootableApp<TServices> = {
    boot(): Promise<{
        readonly services: TServices;
        dispose(): Promise<void>;
    }>;
};
/** The sign-in seam of `@arki/auth`: a real session, as headers that carry its cookie. */
export type TestAuth<TUser> = {
    readonly testing: {
        signIn(user: {
            readonly email: string;
        }): Promise<{
            readonly headers: Headers;
            readonly user: TUser;
        }>;
    };
};
/** A stack the e2e layer can use: it must have a `mailpit` service. */
export type E2EServices = Readonly<Record<string, ServiceSpec<Json, Json>>> & {
    readonly mailpit: ServiceSpec<null, MailpitWorker>;
};
/** One person in a test: a signed-in browser page and a view of their own mail. */
export type Actor<TUser> = {
    readonly email: string;
    readonly user: TUser;
    readonly page: Page;
    readonly mail: {
        /** Waits for a mail to this actor. */
        waitFor(match?: {
            readonly subject?: string | RegExp;
            readonly timeoutMs?: number;
        }): Promise<ReceivedMail>;
        all(): Promise<readonly MailSummary[]>;
        clear(): Promise<void>;
    };
};
export type CronRun = {
    readonly status: number;
    readonly body: unknown;
};
type WorkerFixtures<M extends E2EServices, TServices> = {
    /** The running app server of this worker, the env it started with, and this worker's service values. */
    server: RunningServer & {
        readonly env: Readonly<Record<string, string>>;
        readonly values: WorkerValues<M>;
    };
    /** The graph booted inside this worker. */
    graph: TServices;
    /** The app's services, from the graph booted inside this worker. */
    seed: TServices;
    mailbox: Mailbox;
};
/**
 * What a test shares with the ones before it on the same worker.
 * `shared` (default): the worker's database, mail and keys as the last test left them.
 * `fresh`: every table emptied, mail and keys flushed before the test starts. Use it for a test
 * that runs work over everything in the database (a global cron), whose outcome would otherwise
 * depend on the tests that ran before it. Set it with `test.use({ isolation: 'fresh' })`.
 */
export type Isolation = 'shared' | 'fresh';
type TestFixtures<TUser, TFactories> = {
    isolation: Isolation;
    /** Runs first (it is automatic): puts the worker in the state `isolation` asks for. */
    freshWorker: undefined;
    serverLog: undefined;
    actingAs(user?: {
        readonly email?: string;
    }): Promise<Actor<TUser>>;
    cron: {
        run(name: string): Promise<CronRun>;
    };
    factories: TFactories;
};
export type E2EOptions<M extends E2EServices, TServices, TUser, TFactories> = {
    readonly stack: Stack<M>;
    /** A loader, so the app's env is set before its modules read it. */
    readonly app: () => Promise<BootableApp<TServices>>;
    readonly auth: (services: TServices) => TestAuth<TUser>;
    readonly serve: ServerOptions['serve'];
    readonly factories: (services: TServices) => TFactories;
    /** The env name of the cron secret. Default `CRON_SECRET`. */
    readonly cronSecretEnv?: string;
};
export declare function e2eTest<M extends E2EServices, TServices, TUser, TFactories>(options: E2EOptions<M, TServices, TUser, TFactories>): {
    test: TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & TestFixtures<TUser, TFactories>, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions & WorkerFixtures<M, TServices>>;
    expect: import("@playwright/test").Expect<{
        toScore<TOutput, TInput = unknown, TExpected = unknown>(received: TOutput, scorer: import("../ai/score.js").Scorer<TOutput, TInput, TExpected>, options?: import("../ai/matcher.js").ScoreOptions<TInput, TExpected>): Promise<{
            pass: boolean;
            message: () => string;
            name: string;
        }>;
    }>;
    story: {
        (id: string, title: string, body: StoryBody<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & TestFixtures<TUser, TFactories>, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions & WorkerFixtures<M, TServices>>): void;
        (id: string, title: string, details: {
            readonly tag: string;
        }, body: StoryBody<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & TestFixtures<TUser, TFactories>, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions & WorkerFixtures<M, TServices>>): void;
    };
};
export { type WorkerValues } from '../stack/index.js';
/** What a story body receives from a test built by `e2eTest`, plus whatever the app added with `extend`. */
export type StoryBody<TArgs extends object, WArgs extends object> = (args: TArgs & WArgs, testInfo: TestInfo) => Promise<void> | void;
/**
 * `story(id, title, body)` for any Playwright test, including one an app extended with its own
 * fixtures. The title starts with the id, so the report and the PRD agree.
 */
export declare function storyFor<TArgs extends object, WArgs extends object>(test: TestType<TArgs, WArgs>): {
    (id: string, title: string, body: StoryBody<TArgs, WArgs>): void;
    (id: string, title: string, details: {
        readonly tag: string;
    }, body: StoryBody<TArgs, WArgs>): void;
};
//# sourceMappingURL=test.d.ts.map