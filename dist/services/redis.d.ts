export type RedisWorker = {
    readonly url: string;
};
export declare const redis: (options?: {
    readonly image?: string;
}) => import("../stack/index.js").ServiceSpec<null, RedisWorker>;
/** Empties every key of the Redis at `url` (`FLUSHALL`), so one test's keys never reach the next. */
export declare function flushRedis(url: string): Promise<void>;
//# sourceMappingURL=redis.d.ts.map