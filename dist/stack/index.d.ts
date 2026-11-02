/**
 * `@arki/testing/stack` — the real services a test run needs, declared once per app.
 *
 * A service has two moments. `start` runs once per run, in the runner process (`globalSetup`).
 * `slice` runs once per worker, in the worker, and gives that worker its own piece (a database
 * cloned from a template, a Mailpit container). Values that cross processes must be JSON: the
 * runner writes them into one env variable (`ARKI_STACK`) and every worker reads them back.
 */
import type { FailureOf } from '@arki/failure';
export type Json = string | number | boolean | null | readonly Json[] | {
    readonly [key: string]: Json;
};
/** A running piece. `stop` can be called any number of times. */
export type Started<T> = {
    readonly value: T;
    readonly stop: () => Promise<void>;
};
export type StartContext = {
    /** Unique per run. Services use it to name containers and databases. */
    readonly runId: string;
};
export type WorkerContext = {
    readonly runId: string;
    readonly workerIndex: number;
};
/** `run`: started once per run. `worker`: a new piece for every worker. */
export type ServiceScope = 'run' | 'worker';
export type ServiceSpec<TRun extends Json, TWorker extends Json = TRun> = {
    readonly name: string;
    readonly scope: ServiceScope;
    /** Once per run, in the runner. A failed start must leave nothing running. */
    start(ctx: StartContext): Promise<Started<TRun>>;
    /** Once per worker. Without it, every worker shares the run value. */
    slice?(run: TRun, ctx: WorkerContext): Promise<Started<TWorker>>;
};
/** Writes a service. Method syntax in the type keeps every spec assignable to the stack's map. */
export declare function service<TRun extends Json, TWorker extends Json = TRun>(spec: ServiceSpec<TRun, TWorker>): ServiceSpec<TRun, TWorker>;
export type ServiceMap = Readonly<Record<string, ServiceSpec<Json, Json>>>;
type RunOf<S> = S extends ServiceSpec<infer R, Json> ? R : never;
type WorkerOf<S> = S extends ServiceSpec<Json, infer W> ? W : never;
export type RunValues<M extends ServiceMap> = {
    readonly [K in keyof M]: RunOf<M[K]>;
};
export type WorkerValues<M extends ServiceMap> = {
    readonly [K in keyof M]: WorkerOf<M[K]>;
};
export type Env = Readonly<Record<string, string>>;
export type StackOptions<M extends ServiceMap> = {
    readonly services: M;
    /** The env the app server and the in-process app boot with. `origin` is the worker's server URL. */
    readonly env: (worker: WorkerValues<M>, context: {
        readonly origin: string;
    }) => Env;
};
/** What crosses the process boundary: the run values and the run id. Plain JSON. */
export type StackManifest = {
    readonly runId: string;
    readonly run: Readonly<Record<string, Json>>;
};
export type WorkerSlice<M extends ServiceMap> = {
    readonly values: WorkerValues<M>;
    /** The env for a server that will listen at `origin`. */
    envFor(origin: string): Env;
    stop(): Promise<void>;
};
export type AttachedStack<M extends ServiceMap> = {
    worker(workerIndex: number): Promise<WorkerSlice<M>>;
};
export type RunningStack<M extends ServiceMap> = AttachedStack<M> & {
    readonly manifest: StackManifest;
    stop(): Promise<void>;
};
export type Stack<M extends ServiceMap> = {
    readonly services: M;
    /** Runner side: start every service. */
    start(ctx: StartContext): Promise<RunningStack<M>>;
    /** Worker side: use the run values the runner already started. */
    attach(manifest: StackManifest): AttachedStack<M>;
};
export declare const STACK_ENV_KEY = "ARKI_STACK";
/**
 * `ARKI_STACK` is empty: the stack starts in Playwright's `globalSetup`, so the test was not run through
 * `playwright test`, or the stack was not started first.
 *
 * @fix Run the tests with `playwright test`, or start the stack before reading the manifest.
 * @verify cd packages/testing && bun run vitest run src/stack/index.test.ts
 */
export declare const StackNotStarted: import("@arki/failure").FailureDefinition<"testing.stack_not_started", undefined>;
/**
 * `ARKI_STACK` holds text that is not the manifest the runner writes: not JSON, or not `{ runId: string, run: object }`.
 *
 * @fix Do not set `ARKI_STACK` by hand; let `stackSetup` write it.
 * @verify cd packages/testing && bun run vitest run src/stack/index.test.ts
 */
export declare const StackManifestInvalid: import("@arki/failure").FailureDefinition<"testing.stack_manifest_invalid", undefined>;
/** Every failure `readManifest` returns. */
export declare const READ_MANIFEST_FAILURES: readonly [import("@arki/failure").FailureDefinition<"testing.stack_not_started", undefined>, import("@arki/failure").FailureDefinition<"testing.stack_manifest_invalid", undefined>];
/** A failure value returned by `readManifest`. */
export type ReadManifestFailure = FailureOf<(typeof READ_MANIFEST_FAILURES)[number]>;
/**
 * Reads the manifest the runner put in `process.env.ARKI_STACK`. The one place it is validated.
 * Returns {@link StackNotStarted} for an empty env and {@link StackManifestInvalid} for text that is not a manifest.
 */
export declare function readManifest(raw?: string | undefined): StackManifest | ReadManifestFailure;
export declare function defineStack<const M extends ServiceMap>(options: StackOptions<M>): Stack<M>;
export {};
//# sourceMappingURL=index.d.ts.map