/**
 * Enhanced Assertion Helpers for Testing
 *
 * Provides comprehensive assertion utilities for common testing patterns
 * beyond the basic assertions built into IntegrationTester.
 */
import type { SchemaInput, StandardSchemaV1 } from '@arki/schema';
import type { Timestamp } from './timestamps.js';
/**
 * Assert that a pagination response is valid
 *
 * @param response - Response to validate
 * @param options - Expected values
 *
 * @example
 * ```typescript
 * const result = await tester.caller.user.games.list();
 * assertPaginationValid(result, {
 *   itemsCount: 10,
 *   total: 25,
 *   hasMore: true,
 * });
 * ```
 */
export declare function assertPaginationValid(response: unknown, options?: {
    itemsCount?: number;
    total?: number;
    hasMore?: boolean;
    itemSchema?: StandardSchemaV1;
}): asserts response is {
    items: unknown[];
    total?: number;
    nextCursor?: string | null;
    hasMore?: boolean;
};
/**
 * Assert that a timestamp is recent (within specified seconds)
 *
 * The timestamp may be a `Date`, or a Temporal `Instant` or `ZonedDateTime`
 * from `@arki/date`. It is compared with now by its exact epoch.
 *
 * @param timestamp - Timestamp to check
 * @param options - Options including withinSeconds (default: 10)
 *
 * @example
 * ```typescript
 * const user = await createUser();
 * assertTimestampRecent(user.createdAt, { withinSeconds: 5 });
 * ```
 */
export declare function assertTimestampRecent(timestamp: unknown, options?: {
    withinSeconds?: number;
    label?: string;
}): asserts timestamp is Timestamp;
/**
 * Assert that an array contains an item with the specified ID
 *
 * @param items - Array to search
 * @param id - ID to find
 * @param idField - Field name for ID (default: 'id')
 *
 * @example
 * ```typescript
 * const games = await tester.caller.user.games.list();
 * assertContainsId(games.items, 'game_123');
 * ```
 */
export declare function assertContainsId<T extends {
    id: unknown;
}>(items: T[], id: string): void;
export declare function assertContainsId<T extends object>(items: T[], id: string, idField: keyof T): void;
/**
 * Assert that an array does NOT contain an item with the specified ID
 *
 * @param items - Array to search
 * @param id - ID that should not be found
 * @param idField - Field name for ID (default: 'id')
 *
 * @example
 * ```typescript
 * const games = await tester.caller.user.games.list();
 * assertNotContainsId(games.items, 'game_deleted');
 * ```
 */
export declare function assertNotContainsId<T extends {
    id: unknown;
}>(items: T[], id: string): void;
export declare function assertNotContainsId<T extends object>(items: T[], id: string, idField: keyof T): void;
/**
 * Assert that an error was thrown with expected message
 *
 * @param callback - Async function to execute
 * @param expectedMessage - Expected error message (string or regex)
 *
 * @example
 * ```typescript
 * await assertErrorThrown(
 *   async () => tester.caller.user.games.delete({ id: 'invalid' }),
 *   /not found/i
 * );
 * ```
 */
export declare function assertErrorThrown(callback: () => Promise<unknown>, expectedMessage?: string | RegExp): Promise<Error>;
/**
 * Assert that an error was NOT thrown
 *
 * @param callback - Async function to execute
 *
 * @example
 * ```typescript
 * await assertNoError(
 *   async () => tester.caller.user.games.get({ id: 'game_123' })
 * );
 * ```
 */
export declare function assertNoError(callback: () => Promise<unknown>): Promise<void>;
/**
 * Assert array has expected length
 *
 * @param array - Array to check
 * @param expectedLength - Expected length
 * @param label - Optional label for error message
 *
 * @example
 * ```typescript
 * const games = await tester.caller.user.games.list();
 * assertArrayLength(games.items, 10, 'games');
 * ```
 */
export declare function assertArrayLength(array: unknown[], expectedLength: number, label?: string): void;
/**
 * Assert array is not empty
 *
 * @param array - Array to check
 * @param label - Optional label for error message
 *
 * @example
 * ```typescript
 * const games = await tester.caller.user.games.list();
 * assertArrayNotEmpty(games.items, 'games');
 * ```
 */
export declare function assertArrayNotEmpty(array: unknown[], label?: string): void;
/**
 * Assert array is empty
 *
 * @param array - Array to check
 * @param label - Optional label for error message
 *
 * @example
 * ```typescript
 * const games = await tester.caller.user.games.list({ status: 'archived' });
 * assertArrayEmpty(games.items, 'archived games');
 * ```
 */
export declare function assertArrayEmpty(array: unknown[], label?: string): void;
/**
 * Assert object matches partial shape (deep partial match)
 *
 * @param actual - Actual object
 * @param expected - Expected partial object
 * @param label - Optional label for error message
 *
 * @example
 * ```typescript
 * const game = await tester.caller.user.games.get({ id: 'game_123' });
 * assertDeepPartialMatch(game, {
 *   name: 'Chess',
 *   status: 'active',
 *   metadata: { difficulty: 'hard' }
 * });
 * ```
 */
export declare function assertDeepPartialMatch(actual: unknown, expected: unknown, label?: string, path?: string[]): void;
/**
 * Assert array is sorted by a field
 *
 * @param array - Array to check
 * @param field - Field to check sorting
 * @param order - Sort order ('asc' or 'desc')
 *
 * @example
 * ```typescript
 * const games = await tester.caller.user.games.list({ orderBy: 'name' });
 * assertArraySorted(games.items, 'name', 'asc');
 * ```
 */
export declare function assertArraySorted<T extends object>(array: T[], field: keyof T, order?: 'asc' | 'desc'): void;
/**
 * Assert value is one of the expected values
 *
 * @param value - Value to check
 * @param expectedValues - Array of expected values
 * @param label - Optional label for error message
 *
 * @example
 * ```typescript
 * const game = await tester.caller.user.games.get({ id: 'game_123' });
 * assertOneOf(game.status, ['active', 'draft', 'archived'], 'game status');
 * ```
 */
export declare function assertOneOf<T>(value: T, expectedValues: T[], label?: string): void;
/**
 * Assert value matches a Standard Schema (zod, valibot, arktype, ...)
 *
 * Assertions are synchronous: an async schema throws `UnexpectedFailure`
 * carrying `AsyncSchema` instead of being awaited. A validator that throws is
 * rethrown as is, never reported as invalid data.
 *
 * @param value - Value to validate
 * @param schema - Standard Schema
 * @param label - Optional label for error message
 *
 * @example
 * ```typescript
 * const game = await tester.caller.user.games.get({ id: 'game_123' });
 * assertMatchesSchema(game, gameSchema, 'game');
 * ```
 */
export declare function assertMatchesSchema<Schema extends StandardSchemaV1>(value: unknown, schema: Schema, label?: string): asserts value is SchemaInput<Schema>;
//# sourceMappingURL=assertions.d.ts.map