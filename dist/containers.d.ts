/**
 * `@arki/testing/containers` — one shared Postgres and one shared Redis container for a whole Vitest run.
 * Call `setupGlobalTestContainers` from `globalSetup` and `teardownGlobalTestContainers` after it.
 */
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedTestContainer } from 'testcontainers';
export declare const POSTGRES_GLOBAL_KEY = "__POSTGRES_CONNECTION_STRING__";
export declare const REDIS_GLOBAL_KEY = "__REDIS_CONNECTION_STRING__";
export type SharedContainerOptions = {
    postgresImage?: string;
    redisImage?: string;
};
export declare function startPostgresContainer(image?: string): Promise<StartedPostgreSqlContainer>;
export declare function startRedisContainer(image?: string): Promise<StartedTestContainer>;
export declare function getGlobalPostgresConnectionString(): string | undefined;
export declare function getGlobalRedisConnectionString(): string | undefined;
export declare function setupGlobalTestContainers(options?: SharedContainerOptions): Promise<void>;
export declare function teardownGlobalTestContainers(): Promise<void>;
//# sourceMappingURL=containers.d.ts.map