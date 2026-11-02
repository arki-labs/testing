/**
 * Debug Utilities for Testing
 *
 * Provides debugging helpers for inspecting database state,
 * queries, and test execution.
 *
 * Also provides runtime debug logging using @arki/log (`fromEnv()` reads DEBUG):
 * - DEBUG=testing:tester - Main tester lifecycle and operations
 * - DEBUG=testing:containers - Container startup and management
 * - DEBUG=testing:factories - Factory operations and data generation
 * - DEBUG=testing:* - All testing package logs
 */
import type { AnyRelations } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
/**
 * Runtime debug logger for main tester operations
 */
export declare const debugTester: import("@arki/log").Logger;
/**
 * Runtime debug logger for container operations
 */
export declare const debugContainers: import("@arki/log").Logger;
/**
 * Runtime debug logger for factory operations
 */
export declare const debugFactories: import("@arki/log").Logger;
/**
 * Options for debug logging
 */
export type DebugOptions = {
    /**
     * Whether debug logging is enabled
     * @default process.env.DEBUG_TESTS === 'true'
     */
    enabled?: boolean;
    /**
     * Function to use for logging
     * @default console.log
     */
    logger?: (message: string, ...args: unknown[]) => void;
};
/**
 * Configure debug options globally
 *
 * @param options - Debug options
 *
 * @example
 * ```typescript
 * configureDebug({ enabled: true, logger: customLogger });
 * ```
 */
export declare function configureDebug(options: DebugOptions): void;
/**
 * Check if debug logging is enabled
 */
export declare function isDebugEnabled(): boolean;
/**
 * Log a debug message (only if debug is enabled)
 *
 * @param message - Message to log
 * @param args - Additional arguments
 *
 * @example
 * ```typescript
 * logDebug('Creating test user', { email: 'test@example.com' });
 * ```
 */
export declare function logDebug(message: string, ...args: unknown[]): void;
/**
 * Log SQL query with parameters
 *
 * @param query - SQL query string
 * @param params - Query parameters
 *
 * @example
 * ```typescript
 * logQuery('SELECT * FROM users WHERE id = $1', ['usr_123']);
 * ```
 */
export declare function logQuery(query: string, params?: readonly unknown[]): void;
/**
 * Log the current state of an object
 *
 * @param label - Label for the state
 * @param state - Object to log
 *
 * @example
 * ```typescript
 * logState('User after update', user);
 * ```
 */
export declare function logState(label: string, state: unknown): void;
/**
 * Dump all tables and their row counts from the database
 *
 * @param db - Database instance
 *
 * @example
 * ```typescript
 * await dumpDatabase(tester.db);
 * // Output:
 * // [DB DUMP] Table counts:
 * // - users: 5 rows
 * // - games: 10 rows
 * // - sessions: 25 rows
 * ```
 */
export declare function dumpDatabase<TSchema extends AnyRelations>(db: NodePgDatabase<TSchema>): Promise<void>;
/**
 * Dump specific table contents
 *
 * @param db - Database instance
 * @param tableName - Name of the table to dump
 * @param limit - Maximum number of rows to display (default: 10)
 *
 * @example
 * ```typescript
 * await dumpTable(tester.db, 'users', 5);
 * ```
 */
export declare function dumpTable<TSchema extends AnyRelations>(db: NodePgDatabase<TSchema>, tableName: string, limit?: number): Promise<void>;
/**
 * Create a timing tracker for measuring execution time
 *
 * @param label - Label for the operation
 * @returns Object with end() method to stop timing
 *
 * @example
 * ```typescript
 * const timer = timeOperation('Creating 100 users');
 * // ... do work ...
 * timer.end(); // Logs: "[TIMING] Creating 100 users: 1234ms"
 * ```
 */
export declare function timeOperation(label: string): {
    end: () => void;
};
/**
 * Log the start of a test section
 *
 * @param label - Section label
 *
 * @example
 * ```typescript
 * logSection('Setup test data');
 * // ... setup code ...
 * logSection('Execute test');
 * // ... test code ...
 * ```
 */
export declare function logSection(label: string): void;
/**
 * Create a scoped debug context
 *
 * @param context - Context label
 * @returns Debug functions scoped to the context
 *
 * @example
 * ```typescript
 * const debug = createDebugContext('UserTests');
 * debug.log('Creating user'); // [DEBUG] [UserTests] Creating user
 * debug.state('User', user);  // [STATE] [UserTests] User: {...}
 * ```
 */
export declare function createDebugContext(context: string): {
    log: (message: string, ...args: unknown[]) => void;
    query: (query: string, params?: readonly unknown[]) => void;
    state: (label: string, state: unknown) => void;
    section: (label: string) => void;
};
//# sourceMappingURL=debug.d.ts.map