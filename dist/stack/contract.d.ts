import type { Json, ServiceSpec } from './index.js';
/** Containers still alive (or stopped but not removed) that carry this run's label. */
export declare function leftoverContainers(runId: string): Promise<readonly string[]>;
export declare function newRunId(): string;
export type ContractOptions<TRun extends Json, TWorker extends Json> = {
    readonly name: string;
    readonly make: () => ServiceSpec<TRun, TWorker>;
    /** A service of the same kind whose `start` fails after it has begun work. */
    readonly makeFailing?: () => ServiceSpec<TRun, TWorker>;
    /** Proves a slice works, for example by connecting. Runs on two slices at once. */
    readonly probe?: (worker: TWorker) => Promise<void>;
    /** Proves two slices do not see each other. */
    readonly apart?: (a: TWorker, b: TWorker) => Promise<void>;
};
export declare function describeServiceContract<TRun extends Json, TWorker extends Json>(options: ContractOptions<TRun, TWorker>): void;
//# sourceMappingURL=contract.d.ts.map