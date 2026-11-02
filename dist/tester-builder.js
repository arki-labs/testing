/**
 * Tester Builder - tRPC-style initialization pattern
 *
 * Following tRPC's initTRPC pattern:
 * - Builder pattern with chainable methods
 * - Type inference from context
 * - Generic parameters inferred from usage, not declared upfront
 *
 * @example
 * ```typescript
 * const t = initTester
 *   .context<AppContext>()
 *   .caller<Caller>()
 *   .create({
 *     schema,
 *     migrationsFolder: './migrations',
 *     createDatabase,
 *     createContext,
 *     createCaller,
 *     createRepositories,
 *     defaultUsers,
 *   });
 *
 * export const createTester = t.tester.withFactories(factories);
 * export type AppTester = ReturnType<typeof createTester>;
 * ```
 */
import { IntegrationTester } from './integration-tester.js';
/**
 * Internal implementation class
 */
class TesterBuilderImpl {
    config;
    constructor(config) {
        this.config = config;
    }
    get tester() {
        return {
            withFactories: (factories) => {
                return (options) => {
                    class ConfiguredTester extends IntegrationTester {
                        factory = factories;
                    }
                    return new ConfiguredTester(this.config, options);
                };
            },
            create: (options) => {
                class ConfiguredTester extends IntegrationTester {
                }
                return new ConfiguredTester(this.config, options);
            },
        };
    }
}
/**
 * Initialize the tester builder
 *
 * Following tRPC's initTRPC pattern - start by capturing types,
 * then provide configuration.
 *
 * @example
 * ```typescript
 * // In tester.ts
 * const t = initTester
 *   .context<AppContext>()
 *   .caller<Caller>()
 *   .create({
 *     schema,
 *     migrationsFolder: './migrations',
 *     createContext,
 *     createCaller,
 *     createRepositories,
 *     defaultUsers,
 *   });
 *
 * // Export tester factory with typed factories
 * export const createTester = t.tester.withFactories(factories);
 * export type AppTester = ReturnType<typeof createTester>;
 * ```
 */
export const initTester = {
    context: () => ({
        caller: () => ({
            create: config => new TesterBuilderImpl(config),
        }),
    }),
};
//# sourceMappingURL=tester-builder.js.map