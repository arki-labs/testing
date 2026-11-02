import type { AttachedStack, Env, ServiceMap, WorkerValues } from '../stack/index.js';
export type ServerOptions = {
    readonly build: {
        /** For example `['bun', 'run', 'build']`. */
        readonly command: readonly [string, ...string[]];
        readonly cwd: string;
        /** Files and folders whose change means the build is stale. */
        readonly inputs: readonly string[];
        /** A file the build writes; the build is skipped when it is newer than the inputs' hash. */
        readonly output: string;
    };
    readonly serve: {
        /** For example `['bun', '.output/server/index.mjs']`. */
        readonly command: readonly [string, ...string[]];
        readonly cwd: string;
        /** A path that answers 200 once the server is ready. */
        readonly readyPath: string;
    };
};
/** Builds the app unless the sources are unchanged since the last build. Returns whether it built. */
export declare function ensureBuilt(build: ServerOptions['build']): Promise<boolean>;
export declare function freePort(): Promise<number>;
/** Only what a server needs to find its tools. Nothing from the developer's shell leaks in. */
export declare function baseEnv(): Record<string, string>;
export type RunningServer = {
    readonly url: string;
    /** Stops the process, starts it again with the same env and waits until it is ready. Returns how long it took. */
    restart(): Promise<number>;
    /** The last 200 lines the server printed. */
    logs(): string;
    stop(): Promise<void>;
};
export declare function startServer(options: {
    readonly serve: ServerOptions['serve'];
    readonly env: Readonly<Record<string, string>>;
    readonly port: number;
}): Promise<RunningServer>;
/**
 * Takes this worker's slice of the stack, starts the app server against it and hands both to `use`.
 * The server and the slice are stopped on every path (a failed port, a server that never gets ready,
 * a test that throws), and a stop that rejects does not stop the other one from running.
 */
export declare function serveWorker<M extends ServiceMap>(options: {
    readonly stack: AttachedStack<M>;
    readonly workerIndex: number;
    readonly serve: ServerOptions['serve'];
    use(server: RunningServer & {
        readonly env: Env;
        readonly values: WorkerValues<M>;
    }): Promise<void>;
}): Promise<void>;
//# sourceMappingURL=server.d.ts.map