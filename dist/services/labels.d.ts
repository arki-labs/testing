/** Every container this package starts carries this label, so a leak is findable and testable. */
export declare const RUN_LABEL = "arki-testing-run";
/** A run id as a safe part of a database or container name. */
export declare function safeId(runId: string): string;
/** Stops a thing at most once, whatever the caller does. */
export declare function once(stop: () => Promise<unknown>): () => Promise<void>;
/** A `stop` for a piece that holds nothing. */
export declare const nothingToStop: () => Promise<void>;
//# sourceMappingURL=labels.d.ts.map