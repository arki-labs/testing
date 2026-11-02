export type PostgresRun = {
    readonly adminUrl: string;
    readonly templateDb: string;
};
export type PostgresWorker = {
    readonly url: string;
    readonly database: string;
};
export type PostgresOptions = {
    /** Default `postgres:17-alpine`. */
    readonly image?: string;
    /** Builds the app's schema in the template. `url` points at the template; it runs once per run. */
    readonly buildSchema: (url: string) => Promise<void>;
};
/** Empties every table in `url`, restarting identities. Use between tests that share a worker. */
export declare function truncateAll(url: string): Promise<void>;
export declare const postgres: (options: PostgresOptions) => import("../stack/index.js").ServiceSpec<PostgresRun, PostgresWorker>;
//# sourceMappingURL=postgres.d.ts.map