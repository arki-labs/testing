/**
 * Performance Testing Utilities
 *
 * Provides helpers for measuring and asserting performance characteristics
 * of database operations and API calls.
 */
import type { AnyRelations } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
/**
 * Performance measurement result
 */
export type PerformanceResult = {
    /**
     * Operation label
     */
    label: string;
    /**
     * Duration in milliseconds
     */
    durationMs: number;
    /**
     * Start timestamp
     */
    startTime: number;
    /**
     * End timestamp
     */
    endTime: number;
    /**
     * Whether the operation passed the performance threshold
     */
    passed: boolean;
    /**
     * Maximum allowed duration (if specified)
     */
    maxMs?: number;
};
/**
 * Measure the performance of an operation
 *
 * @param label - Label for the operation
 * @param operation - Async operation to measure
 * @param options - Options including maxMs threshold
 * @returns Performance result
 *
 * @throws Error if maxMs is specified and operation exceeds it
 *
 * @example
 * ```typescript
 * const result = await measurePerformance(
 *   'Create 100 users',
 *   async () => {
 *     for (let i = 0; i < 100; i++) {
 *       await createUser();
 *     }
 *   },
 *   { maxMs: 1000 }
 * );
 *
 * console.log(`Took ${result.durationMs}ms`);
 * ```
 */
export declare function measurePerformance<T>(label: string, operation: () => Promise<T>, options?: {
    maxMs?: number;
    logResult?: boolean;
}): Promise<PerformanceResult & {
    result: T;
}>;
/**
 * Benchmark a query by running it multiple times
 *
 * @param label - Label for the benchmark
 * @param query - Query function to benchmark
 * @param iterations - Number of iterations (default: 10)
 * @returns Benchmark statistics
 *
 * @example
 * ```typescript
 * const stats = await benchmarkQuery(
 *   'Get user by ID',
 *   () => tester.repo.users.findById('usr_123'),
 *   100
 * );
 *
 * console.log(`Average: ${stats.avgMs}ms, P95: ${stats.p95Ms}ms`);
 * ```
 */
export declare function benchmarkQuery<T>(label: string, query: () => Promise<T>, iterations?: number): Promise<{
    label: string;
    iterations: number;
    totalMs: number;
    avgMs: number;
    minMs: number;
    maxMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    durations: number[];
}>;
/**
 * Compare the performance of multiple operations
 *
 * @param operations - Object mapping labels to operation functions
 * @param iterations - Number of iterations per operation (default: 10)
 * @returns Comparison results sorted by average duration
 *
 * @example
 * ```typescript
 * const comparison = await comparePerformance({
 *   'Method A': () => methodA(),
 *   'Method B': () => methodB(),
 *   'Method C': () => methodC(),
 * }, 20);
 *
 * // Shows ranked results with percentage differences
 * ```
 */
export declare function comparePerformance<T extends Record<string, () => Promise<unknown>>>(operations: T, iterations?: number): Promise<{
    label: string;
    avgMs: number;
    minMs: number;
    maxMs: number;
    relativeDiff: string;
}[]>;
/**
 * Assert that an operation completes within the specified time
 *
 * @param label - Label for the operation
 * @param operation - Async operation to measure
 * @param maxMs - Maximum allowed duration in milliseconds
 * @returns The result of the operation
 *
 * @throws Error if operation exceeds maxMs
 *
 * @example
 * ```typescript
 * const user = await assertPerformance(
 *   'Get user by ID',
 *   () => tester.repo.users.findById('usr_123'),
 *   100
 * );
 * ```
 */
export declare function assertPerformance<T>(label: string, operation: () => Promise<T>, maxMs: number): Promise<T>;
/**
 * Create a performance tracker that can measure multiple operations
 *
 * @example
 * ```typescript
 * const tracker = createPerformanceTracker();
 *
 * await tracker.measure('Setup', async () => {
 *   // setup code
 * });
 *
 * await tracker.measure('Main operation', async () => {
 *   // main code
 * });
 *
 * await tracker.measure('Cleanup', async () => {
 *   // cleanup code
 * });
 *
 * tracker.printSummary();
 * ```
 */
export declare function createPerformanceTracker(): {
    measure<T>(label: string, operation: () => Promise<T>, options?: {
        maxMs?: number;
    }): Promise<T>;
    getMeasurements(): PerformanceResult[];
    printSummary(): void;
    clear(): void;
};
/**
 * Measure database query execution time
 *
 * @param db - Database instance
 * @param queryFn - Query function to measure
 * @param label - Label for the query
 * @returns Query result and timing information
 *
 * @example
 * ```typescript
 * const { result, durationMs } = await measureQuery(
 *   tester.db,
 *   (db) => db.select().from(users).where(eq(users.id, 'usr_123')),
 *   'Get user by ID'
 * );
 * ```
 */
export declare function measureQuery<TSchema extends AnyRelations, T>(db: NodePgDatabase<TSchema>, queryFn: (db: NodePgDatabase<TSchema>) => Promise<T>, label?: string): Promise<{
    result: T;
    durationMs: number;
}>;
//# sourceMappingURL=performance.d.ts.map