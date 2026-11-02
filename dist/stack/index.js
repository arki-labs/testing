/**
 * `@arki/testing/stack` — the real services a test run needs, declared once per app.
 *
 * A service has two moments. `start` runs once per run, in the runner process (`globalSetup`).
 * `slice` runs once per worker, in the worker, and gives that worker its own piece (a database
 * cloned from a template, a Mailpit container). Values that cross processes must be JSON: the
 * runner writes them into one env variable (`ARKI_STACK`) and every worker reads them back.
 */
import { defineFailure, isFailure } from '@arki/failure';
import { is, parse, recordSchema } from '@arki/schema';
/** Writes a service. Method syntax in the type keeps every spec assignable to the stack's map. */
export function service(spec) {
    return spec;
}
export const STACK_ENV_KEY = 'ARKI_STACK';
/**
 * `ARKI_STACK` is empty: the stack starts in Playwright's `globalSetup`, so the test was not run through
 * `playwright test`, or the stack was not started first.
 *
 * @fix Run the tests with `playwright test`, or start the stack before reading the manifest.
 * @verify cd packages/testing && bun run vitest run src/stack/index.test.ts
 */
export const StackNotStarted = /* @__PURE__ */ defineFailure('testing.stack_not_started', {
    status: 500,
    message: 'ARKI_STACK is empty: the stack has not been started.',
    remediation: "The stack starts in Playwright's globalSetup; run the tests through `playwright test`.",
});
/**
 * `ARKI_STACK` holds text that is not the manifest the runner writes: not JSON, or not `{ runId: string, run: object }`.
 *
 * @fix Do not set `ARKI_STACK` by hand; let `stackSetup` write it.
 * @verify cd packages/testing && bun run vitest run src/stack/index.test.ts
 */
export const StackManifestInvalid = /* @__PURE__ */ defineFailure('testing.stack_manifest_invalid', {
    status: 500,
    message: 'ARKI_STACK must be JSON text of an object with a string runId and an object run.',
    remediation: 'Do not set ARKI_STACK by hand; let stackSetup write it.',
});
/** Every failure `readManifest` returns. */
export const READ_MANIFEST_FAILURES = [StackNotStarted, StackManifestInvalid];
/** The value as `Json`, or `undefined` when something inside is not JSON (a function, a symbol, `undefined`). */
function jsonOf(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : undefined;
    if (Array.isArray(value)) {
        const items = value;
        const checked = [];
        for (const item of items) {
            const entry = jsonOf(item);
            if (entry === undefined)
                return undefined;
            checked.push(entry);
        }
        return checked;
    }
    if (!is(value, recordSchema))
        return undefined;
    const checked = {};
    for (const [key, item] of Object.entries(value)) {
        const entry = jsonOf(item);
        if (entry === undefined)
            return undefined;
        checked[key] = entry;
    }
    return checked;
}
/** JSON text of `{ runId: string, run: object }`. The text is parsed inside the schema, so a bad text is an issue, not a throw. */
const manifestTextSchema = {
    '~standard': {
        version: 1,
        vendor: 'arki-testing',
        validate(text) {
            const issue = { issues: [{ message: 'expected JSON text of { runId: string, run: object }' }] };
            if (typeof text !== 'string')
                return issue;
            let json;
            try {
                json = JSON.parse(text);
            }
            catch {
                return issue;
            }
            if (!is(json, recordSchema))
                return issue;
            const runId = json['runId'];
            const run = json['run'];
            if (typeof runId !== 'string' || !is(run, recordSchema))
                return issue;
            const values = {};
            for (const [key, value] of Object.entries(run)) {
                const checked = jsonOf(value);
                if (checked === undefined)
                    return issue;
                values[key] = checked;
            }
            return { value: { runId, run: values } };
        },
    },
};
/**
 * Reads the manifest the runner put in `process.env.ARKI_STACK`. The one place it is validated.
 * Returns {@link StackNotStarted} for an empty env and {@link StackManifestInvalid} for text that is not a manifest.
 */
export function readManifest(raw = process.env[STACK_ENV_KEY]) {
    if (raw === undefined || raw === '')
        return StackNotStarted();
    const manifest = parse(manifestTextSchema, raw);
    return isFailure(manifest) ? StackManifestInvalid({ cause: manifest }) : manifest;
}
/** The stops of the slices a worker owns, in start order. A slice shared with the run is not stopped. */
function ownedStops(slices) {
    return slices.filter(entry => entry[2]).map(entry => () => entry[1].stop());
}
/**
 * Stops every handle, last first, and keeps going when one stop rejects. A single rejection is
 * rethrown as it is; several are thrown together as an `AggregateError`.
 */
async function stopInReverse(stops) {
    const errors = [];
    for (const stop of stops.toReversed()) {
        try {
            await stop();
        }
        catch (error) {
            errors.push(error);
        }
    }
    if (errors.length === 1)
        throw errors[0];
    if (errors.length > 1)
        throw new AggregateError(errors, 'Several services failed to stop.');
}
export function defineStack(options) {
    const entries = Object.entries(options.services);
    function attachTo(runId, run) {
        return {
            async worker(workerIndex) {
                const slices = [];
                try {
                    for (const [key, spec] of entries) {
                        const runValue = run[key];
                        if (runValue === undefined)
                            throw new Error(`STACK_VALUE_MISSING: no run value for service "${key}".`);
                        if (spec.slice === undefined) {
                            slices.push([key, { value: runValue, stop: () => Promise.resolve() }, false]);
                        }
                        else {
                            slices.push([key, await spec.slice(runValue, { runId, workerIndex }), true]);
                        }
                    }
                }
                catch (error) {
                    // The start error is the one worth reporting; a stop error on top of it would hide it.
                    await Promise.allSettled([stopInReverse(ownedStops(slices))]);
                    throw error;
                }
                // Erasure seam: the record is assembled by key at runtime; `WorkerValues<M>` is its exact type.
                const values = Object.fromEntries(slices.map(([key, slice]) => [key, slice.value]));
                return {
                    values,
                    envFor: origin => options.env(values, { origin }),
                    stop: () => stopInReverse(ownedStops(slices)),
                };
            },
        };
    }
    return {
        services: options.services,
        async start(ctx) {
            const started = new Map();
            try {
                // Services start one after another so a failure stops exactly the ones already up.
                for (const [key, spec] of entries)
                    started.set(key, await spec.start(ctx));
            }
            catch (error) {
                // The start error is the one worth reporting; a stop error on top of it would hide it.
                await Promise.allSettled([stopInReverse([...started.values()].map(running => () => running.stop()))]);
                throw error;
            }
            const run = Object.fromEntries([...started].map(([key, running]) => [key, running.value]));
            const attached = attachTo(ctx.runId, run);
            return {
                manifest: { runId: ctx.runId, run },
                worker: workerIndex => attached.worker(workerIndex),
                stop: () => stopInReverse([...started.values()].map(running => () => running.stop())),
            };
        },
        attach: manifest => attachTo(manifest.runId, manifest.run),
    };
}
//# sourceMappingURL=index.js.map