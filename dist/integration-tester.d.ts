import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PgTable } from 'drizzle-orm/pg-core';
import type { StartedTestContainer } from 'testcontainers';
import type { UserId } from '@arki/auth';
import { KV } from '@arki/kv';
import type { IntegrationTesterConfig, TesterDatabase, TesterOptions, TesterUserOverrides, TesterUsers, TestUser, TestUserRole } from './types.js';
import * as assertions from './assertions.js';
import * as debug from './debug.js';
import * as performance from './performance.js';
import type { Timestamp, Timestamps } from './timestamps.js';
type CallerCollection<TCaller> = {
    public: TCaller;
    user: TCaller;
    moderator: TCaller;
    admin: TCaller;
};
/**
 * Integration testing helper class providing comprehensive utilities for testing
 * tRPC applications with PostgreSQL and Redis.
 *
 * @template TSchema - Drizzle schema type
 * @template TDatabase - The root database type, as `createDatabase` returns it (the type of `tester.db`)
 * @template TRepositories - Repository collection type
 * @template TCaller - tRPC caller type
 * @template TContext - tRPC context type
 * @template THandle - What repositories and the context take: the root database or a transaction
 *
 * @example
 * ```typescript
 * const t = initTester.context<AppContext>().caller<Caller>().create({
 *   schema,
 *   migrationsFolder: './migrations',
 *   createDatabase,
 *   createContext,
 *   createCaller,
 *   createRepositories,
 *   defaultUsers: { user, moderator, admin },
 * });
 *
 * const createTester = t.tester.withFactories({ user: userFactory, game: gameFactory });
 *
 * // In tests
 * const tester = createTester();
 * await tester.setup();
 * await tester.withTransaction(async () => {
 *   const user = tester.factory.user(); // typed by the factories passed above
 *   const result = await tester.caller.user.someMethod();
 *   tester.assertValidId(result.id, 'prefix_');
 * });
 * await tester.teardown();
 * ```
 */
export declare class IntegrationTester<TSchema extends Record<string, unknown>, TDatabase extends THandle, TRepositories extends Record<string, unknown>, TCaller, TContext extends Record<string, unknown>, THandle extends TesterDatabase<THandle>> {
    protected readonly config: IntegrationTesterConfig<TSchema, TDatabase, TRepositories, TCaller, TContext, THandle>;
    protected readonly options: TesterOptions;
    protected container: StartedPostgreSqlContainer | null;
    protected ownsContainer: boolean;
    protected baseConnectionString: string | null;
    protected uniqueDatabaseName: string | null;
    protected redisContainer: StartedTestContainer | null;
    protected ownsRedisContainer: boolean;
    protected redisNamespace: string | null;
    protected _db: TDatabase | null;
    protected _repo: TRepositories | null;
    protected _kv: KV | null;
    protected _users: TesterUsers | null;
    protected _baseContext: TContext | null;
    protected currentTransaction: THandle | null;
    protected randomCounter: number;
    protected randomSeed: string;
    protected currentUser: TestUser | null;
    protected currentCaller: TCaller | null;
    /**
     * Access to assertion utilities
     */
    readonly assert: typeof assertions;
    /**
     * Access to debug utilities
     */
    readonly debug: typeof debug;
    /**
     * Access to performance utilities
     */
    readonly performance: typeof performance;
    /**
     * Access to faker instance for custom data generation
     */
    readonly faker: import("@faker-js/faker").Faker;
    constructor(config: IntegrationTesterConfig<TSchema, TDatabase, TRepositories, TCaller, TContext, THandle>, options?: TesterOptions);
    get db(): TDatabase;
    /**
     * Get the current database context (transaction if active, otherwise base db)
     * This ensures operations use the transaction when running inside withTransaction()
     */
    protected getCurrentDb(): THandle;
    /**
     * Repositories on the current database: the test transaction while `withTransaction` is
     * running, the base database otherwise. So a read through `repo` sees what a caller wrote
     * in the same transaction. Read it inside the transaction; a value kept from before it
     * still uses the base database.
     */
    get repo(): TRepositories;
    /**
     * The database callers and `repo` use right now: the test transaction while `withTransaction`
     * is running, the root database otherwise. Use it to check what a caller wrote in the
     * transaction. (`db` is always the root database, so it cannot see uncommitted rows.)
     */
    get currentDb(): THandle;
    get kv(): KV;
    get users(): TesterUsers;
    /**
     * Callers for every role. Each property builds its caller when you read it, on the current
     * database: the test transaction while `withTransaction` is running, the base database
     * otherwise. Read it inside the transaction; a caller you kept from before it still writes
     * on the base database.
     */
    get caller(): CallerCollection<TCaller>;
    get currentTx(): THandle | null;
    getUser(role: 'user' | 'moderator' | 'admin'): TestUser;
    setup(): Promise<void>;
    teardown(): Promise<void>;
    /**
     * Clear specific tables by deleting all rows
     *
     * @param tables - Tables to clear
     *
     * @example
     * ```typescript
     * await tester.clearTables(users, games, sessions);
     * ```
     */
    clearTables(...tables: PgTable[]): Promise<void>;
    /**
     * Clear all tables in the schema
     *
     * @example
     * ```typescript
     * await tester.clearAllTables();
     * ```
     */
    clearAllTables(): Promise<void>;
    /**
     * Clear tables matching a pattern
     *
     * @param pattern - RegExp or string pattern to match table names
     *
     * @example
     * ```typescript
     * // Clear all tables starting with 'temp_'
     * await tester.clearTablesByPattern(/^temp_/);
     * ```
     */
    clearTablesByPattern(pattern: RegExp | string): Promise<void>;
    /**
     * Clear all tables except specified ones
     *
     * @param exceptTables - Tables to preserve
     *
     * @example
     * ```typescript
     * // Clear all tables except users and settings
     * await tester.clearTablesExcept(users, settings);
     * ```
     */
    clearTablesExcept(...exceptTables: PgTable[]): Promise<void>;
    /**
     * Seed the database with test data
     *
     * @param data - Object mapping table names to arrays of records
     *
     * @example
     * ```typescript
     * await tester.seed({
     *   users: [user1, user2, user3],
     *   games: [game1, game2],
     *   sessions: [session1, session2, session3, session4],
     * });
     * ```
     */
    seed<T extends Record<string, readonly object[]>>(data: T): Promise<void>;
    /**
     * Create a custom caller for a specific user
     *
     * @param user - User to create caller for
     * @returns tRPC caller instance
     *
     * @example
     * ```typescript
     * const customUser = { id: 'usr_custom', email: 'custom@example.com', name: 'Custom' };
     * const caller = tester.createCustomCaller(customUser);
     * const result = await caller.someMethod();
     * ```
     */
    createCustomCaller(user: TestUser): TCaller;
    /**
     * Return the default test user and caller with 'user' role
     *
     * @returns Object with user and caller
     *
     * @example
     * ```typescript
     * const { user, caller } = tester.asUser();
     * await caller.someMethod();
     * ```
     */
    asUser(): {
        user: TestUser;
        caller: TCaller;
    };
    /**
     * Create a new dynamic test user with 'user' role and return caller.
     * This creates a new user in the database via the onUserCreate hook.
     * Use this when you need multiple different users in a test.
     *
     * @returns Promise with user and caller
     *
     * @example
     * ```typescript
     * const { user: player1, caller: caller1 } = await tester.createUser();
     * const { user: player2, caller: caller2 } = await tester.createUser();
     * ```
     */
    createUser(): Promise<{
        user: TestUser;
        caller: TCaller;
    }>;
    /**
     * Create a guest (unauthenticated) caller
     *
     * @returns Caller without authentication
     *
     * @example
     * ```typescript
     * const caller = tester.asGuest();
     * await caller.public.getPublicData();
     * ```
     */
    asGuest(): TCaller;
    /**
     * Return the default test user and caller with 'moderator' role
     *
     * @returns Object with moderator user and caller
     *
     * @example
     * ```typescript
     * const { user, caller } = tester.asModerator();
     * await caller.moderation.reviewContent();
     * ```
     */
    asModerator(): {
        user: TestUser;
        caller: TCaller;
    };
    /**
     * Return the default test user and caller with 'admin' role
     *
     * @returns Object with admin user and caller
     *
     * @example
     * ```typescript
     * const { user, caller } = tester.asAdmin();
     * await caller.admin.deleteUser();
     * ```
     */
    asAdmin(): {
        user: TestUser;
        caller: TCaller;
    };
    /**
     * Switch context to a different user and return caller
     *
     * @param userId - User ID to switch to
     * @returns Caller for the specified user
     *
     * @example
     * ```typescript
     * const { user: user1 } = tester.asUser();
     * const { user: user2 } = tester.asUser();
     * const caller1 = tester.withUser(user1.id);
     * await caller1.someMethod();
     * ```
     */
    withUser(userId: UserId): TCaller;
    /**
     * Get the current user in the test context
     *
     * @returns Current test user or null if unauthenticated
     *
     * @example
     * ```typescript
     * const { user } = tester.asUser();
     * const currentUser = tester.getCurrentUser();
     * expect(currentUser?.id).toBe(user.id);
     * ```
     */
    getCurrentUser(): TestUser | null;
    /**
     * Get the current caller
     *
     * @returns Current caller instance
     * @throws Error if no caller is available
     *
     * @example
     * ```typescript
     * tester.asUser();
     * const caller = tester.getCaller();
     * await caller.someMethod();
     * ```
     */
    getCaller(): TCaller;
    /**
     * Wait for async projections to complete
     *
     * In event-sourced systems, projections update asynchronously after events are stored.
     * This method waits for a short period to allow projections to process.
     *
     * @param ms - Milliseconds to wait (default: 100ms)
     *
     * @example
     * ```typescript
     * await tester.caller.user.createUser({ ... });
     * await tester.waitForProjections();
     * const user = await tester.caller.user.getUser();
     * ```
     */
    waitForProjections(ms?: number): Promise<void>;
    /**
     * Get the current test context with all services
     */
    get context(): TContext;
    /**
     * Execute a callback within an auto-rollback transaction
     *
     * The transaction is automatically rolled back after the callback completes,
     * leaving the database in a clean state for the next test.
     *
     * @param callback - Async function to execute in transaction
     * @returns Result of callback (always undefined due to rollback)
     *
     * @example
     * ```typescript
     * await tester.withTransaction(async () => {
     *   const user = await tester.db.insert(users).values({...}).returning();
     *   const result = await tester.caller.user.someMethod();
     *   expect(result).toBeDefined();
     *   // Transaction automatically rolls back after this
     * });
     * ```
     */
    withTransaction(callback: () => Promise<unknown>): Promise<void>;
    /**
     * Assert that a value is a valid branded ID with the expected prefix
     *
     * @param value - Value to check
     * @param prefix - Expected ID prefix (e.g., 'usr_', 'game_')
     * @throws Error if value is not a string or doesn't have the correct prefix
     *
     * @example
     * ```typescript
     * const user = await createUser();
     * tester.assertValidId(user.id, 'usr_');
     * ```
     */
    assertValidId(value: unknown, prefix: string): asserts value is string;
    /**
     * Assert that an object has valid createdAt and updatedAt timestamps
     *
     * Each may be a `Date`, or a Temporal `Instant` or `ZonedDateTime` from `@arki/date`.
     *
     * @param obj - Object to check
     * @throws Error if timestamps are missing or are not one of those types
     *
     * @example
     * ```typescript
     * const game = await tester.repo.games.create({...});
     * tester.assertTimestamps(game);
     * ```
     */
    assertTimestamps(obj: unknown): asserts obj is Timestamps;
    /**
     * Assert that updatedAt is greater than or equal to createdAt
     *
     * @param obj - Object with timestamps
     * @throws Error if updatedAt is before createdAt
     *
     * @example
     * ```typescript
     * const game = await tester.repo.games.update(id, {...});
     * tester.assertTimestamps(game);
     * tester.assertUpdatedAfterCreated(game);
     * ```
     */
    assertUpdatedAfterCreated(obj: Timestamps): void;
    /**
     * Assert that a response has valid pagination structure
     *
     * @param response - Response to check
     * @throws Error if response doesn't have items array
     *
     * @example
     * ```typescript
     * const result = await tester.caller.user.games.list();
     * tester.assertPaginatedResponse(result);
     * expect(result.items).toHaveLength(10);
     * ```
     */
    assertPaginatedResponse(response: unknown): asserts response is {
        items: unknown[];
        total?: number;
        nextCursor?: string | null;
        hasMore?: boolean;
    };
    /**
     * Generate a deterministic URL-safe slug
     *
     * @param prefix - Optional prefix for the slug
     * @returns Generated slug
     *
     * @example
     * ```typescript
     * const slug = tester.generateSlug(); // 'test-a1b2c3d4'
     * const slug = tester.generateSlug('game'); // 'game-a1b2c3d4'
     * ```
     */
    generateSlug(prefix?: string): string;
    /**
     * Generate a deterministic email address
     *
     * @param prefix - Optional prefix for the email
     * @returns Generated email
     *
     * @example
     * ```typescript
     * const email = tester.generateEmail(); // 'test-a1b2c3d4@example.com'
     * const email = tester.generateEmail('admin'); // 'admin-a1b2c3d4@example.com'
     * ```
     */
    generateEmail(prefix?: string): string;
    /**
     * Generate a deterministic URL
     *
     * @param path - Optional path component
     * @returns Generated URL
     *
     * @example
     * ```typescript
     * const url = tester.generateUrl(); // 'https://example.com/test-a1b2c3d4'
     * const url = tester.generateUrl('games/chess'); // 'https://example.com/games/chess'
     * ```
     */
    generateUrl(path?: string): string;
    /**
     * Generate a deterministic random string
     *
     * @param length - Length of string (default: 16)
     * @returns Generated string
     *
     * @example
     * ```typescript
     * const token = tester.generateString(32);
     * const code = tester.generateString(6);
     * ```
     */
    generateString(length?: number): string;
    /**
     * Generate a random phone number
     *
     * @param format - Phone format (default: 'US')
     * @returns Generated phone number
     *
     * @example
     * ```typescript
     * const phone = tester.generatePhone(); // '+1-555-123-4567'
     * ```
     */
    generatePhone(format?: 'US' | 'INTERNATIONAL'): string;
    /**
     * Generate a random date within a range
     *
     * @param options - Options for date generation
     * @returns Generated date
     *
     * @example
     * ```typescript
     * // Date in the past year
     * const date = tester.generateDate({ past: { years: 1 } });
     *
     * // Date in the next 30 days
     * const date = tester.generateDate({ future: { days: 30 } });
     *
     * // Date between two dates
     * const date = tester.generateDate({
     *   between: { from: new Date('2024-01-01'), to: new Date('2024-12-31') }
     * });
     * ```
     */
    generateDate(options?: {
        past?: {
            years?: number;
            months?: number;
            days?: number;
        };
        future?: {
            years?: number;
            months?: number;
            days?: number;
        };
        between?: {
            from: Timestamp;
            to: Timestamp;
        };
    }): Date;
    /**
     * Generate a random number between min and max (inclusive)
     *
     * @param min - Minimum value
     * @param max - Maximum value
     * @returns Random number
     *
     * @example
     * ```typescript
     * const score = tester.generateBetween(0, 100);
     * const priority = tester.generateBetween(1, 5);
     * ```
     */
    generateBetween(min: number, max: number): number;
    /**
     * Generate a random value from an enum or array
     *
     * @param values - Enum object or array of values
     * @returns Random value
     *
     * @example
     * ```typescript
     * enum Status { Active = 'active', Inactive = 'inactive', Pending = 'pending' }
     * const status = tester.generateFromEnum(Status);
     *
     * const role = tester.generateFromEnum(['user', 'admin', 'moderator']);
     * ```
     */
    generateFromEnum<T>(values: T[] | Record<string, T>): T;
    /**
     * Get the random seed used for generation (for debugging)
     *
     * @returns Random seed string
     */
    getRandomSeed(): string;
    /**
     * Reset the random counter (useful for creating reproducible sequences within a test)
     *
     * @example
     * ```typescript
     * tester.resetRandomCounter();
     * const email1 = tester.generateEmail(); // Deterministic
     * tester.resetRandomCounter();
     * const email2 = tester.generateEmail(); // Same as email1
     * ```
     */
    resetRandomCounter(): void;
    protected mergeUsers(overrides?: TesterUserOverrides): TesterUsers;
    protected createCaller(role: TestUserRole, user: TestUser | null, context: TContext): TCaller;
    protected buildBaseContext(): TContext;
    /**
     * A short-lived connection built from `config.schema`. The tester uses it for what does not
     * depend on the app's database type: running migrations and creating or dropping the unique
     * test database. Close it with `closeDatabaseClient`.
     */
    protected openSchemaDatabase(connectionString: string): import("drizzle-orm/node-postgres").NodePgDatabase<import("drizzle-orm").ExtractTablesWithRelations<{}, import("drizzle-orm").ExtractTablesFromSchema<TSchema>>>;
    /**
     * Build a caller for `role` on the current database (the test transaction while
     * `withTransaction` runs, the base database otherwise).
     */
    protected callerFor(role: TestUserRole, user: TestUser | null): TCaller;
    /** Make `user` the current user and hand out a caller for it. */
    protected asRole(role: TestUserRole, user: TestUser): {
        user: TestUser;
        caller: TCaller;
    };
}
export type * from './types.js';
//# sourceMappingURL=integration-tester.d.ts.map