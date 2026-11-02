/**
 * Factory System for Test Data Generation
 *
 * Provides a flexible factory pattern supporting both function and builder APIs:
 * - Function pattern: `factory({ field: 'value' })`
 * - Builder pattern: `factory().with('field', 'value').build()`
 *
 * Integrates with @faker-js/faker for realistic test data generation.
 *
 * @example
 * ```typescript
 * import { createFactory } from '@arki/testing';
 * import { faker } from '@faker-js/faker';
 *
 * // Define a factory
 * const userFactory = createFactory<User>(() => ({
 *   id: orThrow(createUserId()),
 *   email: faker.internet.email(),
 *   name: faker.person.fullName(),
 *   createdAt: faker.date.past(),
 *   updatedAt: new Date(),
 * }));
 *
 * // Use function pattern
 * const user1 = userFactory({ email: 'test@example.com' });
 *
 * // Use builder pattern
 * const user2 = userFactory()
 *   .with('email', 'admin@example.com')
 *   .with('name', 'Admin User')
 *   .build();
 * ```
 */
import { debugFactories } from './debug.js';
/**
 * Factory builder for creating test data with a fluent API
 */
export class FactoryBuilder {
    generator;
    overrides = {};
    constructor(generator) {
        this.generator = generator;
    }
    /**
     * Set a field value
     */
    with(field, value) {
        this.overrides[field] = value;
        return this;
    }
    /**
     * Set multiple field values
     */
    withMany(values) {
        Object.assign(this.overrides, values);
        return this;
    }
    /**
     * Build the final object
     */
    build() {
        return {
            ...this.generator(),
            ...this.overrides,
        };
    }
}
/**
 * Create a factory function with dual API support
 *
 * @param generator - Function that generates the base object
 * @param defaults - Optional default values to merge
 * @returns Factory function supporting both patterns
 *
 * @example
 * ```typescript
 * const gameFactory = createFactory<Game>(() => ({
 *   id: createGameId(),
 *   name: faker.word.words(2),
 *   slug: faker.helpers.slugify(faker.word.words(2)),
 *   status: 'active',
 *   createdAt: faker.date.past(),
 *   updatedAt: new Date(),
 * }));
 *
 * // Function pattern
 * const game1 = gameFactory({ name: 'Chess' });
 *
 * // Builder pattern
 * const game2 = gameFactory()
 *   .with('name', 'Checkers')
 *   .with('status', 'draft')
 *   .build();
 * ```
 */
export function createFactory(generator, defaults) {
    function factory(overridesOrNothing) {
        // If called with no arguments, return builder
        if (overridesOrNothing === undefined && arguments.length === 0) {
            return new FactoryBuilder(() => ({
                ...generator(),
                ...defaults,
            }));
        }
        // If called with arguments (even undefined), use function pattern
        return {
            ...generator(),
            ...defaults,
            ...overridesOrNothing,
        };
    }
    return factory;
}
/**
 * Create multiple instances from a factory
 *
 * @param factory - Factory function to use
 * @param count - Number of instances to create
 * @param overrides - Optional overrides for all instances or function to generate per-instance overrides
 * @returns Array of instances
 *
 * @example
 * ```typescript
 * // Create 5 games with same overrides
 * const games = createMany(gameFactory, 5, { status: 'active' });
 *
 * // Create 5 games with different scores
 * const games = createMany(gameFactory, 5, (index) => ({
 *   score: 100 * (index + 1)
 * }));
 * ```
 */
export function createMany(factory, count, overrides) {
    return Array.from({ length: count }, (_, index) => {
        const instanceOverrides = typeof overrides === 'function' ? overrides(index) : overrides;
        return factory(instanceOverrides);
    });
}
/**
 * Create a sequence of instances with specific field values
 *
 * @param factory - Factory function to use
 * @param field - Field to set with sequence values
 * @param values - Array of values to use for the field
 * @param baseOverrides - Optional overrides for all instances
 * @returns Array of instances
 *
 * @example
 * ```typescript
 * // Create sessions with specific scores
 * const sessions = createSequence(
 *   sessionFactory,
 *   'score',
 *   [100, 200, 300, 400, 500]
 * );
 *
 * // Create sessions with specific timestamps
 * const sessions = createSequence(
 *   sessionFactory,
 *   'createdAt',
 *   [new Date('2024-01-01'), new Date('2024-01-02')],
 *   { status: 'completed' }
 * );
 * ```
 */
export function createSequence(factory, field, values, baseOverrides) {
    return values.map(value => {
        const overrides = Object.assign({}, baseOverrides);
        overrides[field] = value;
        return factory(overrides);
    });
}
/**
 * Factory registry: factories looked up by name, with the type of each result known from the name.
 *
 * The registry is built from a map of factories. Its type parameter is inferred from that map, so
 * `registry.create('user')` is a `User` and `registry.create('user', { nope: 1 })` does not compile.
 *
 * @example
 * ```typescript
 * const registry = new FactoryRegistry({ user: userFactory, game: gameFactory });
 *
 * const user = registry.create('user', { email: 'test@example.com' }); // User
 * const users = registry.createMany('user', 5); // User[]
 * ```
 */
export class FactoryRegistry {
    factories;
    constructor(factories) {
        this.factories = factories;
    }
    /**
     * Check if a factory is registered (narrows an arbitrary string to a registered name)
     */
    has(name) {
        const exists = Object.hasOwn(this.factories, name);
        debugFactories.debug('[factories] Checking factory exists (name: {name}, exists: {exists})', { name, exists });
        return exists;
    }
    /**
     * Get a registered factory
     */
    get(name) {
        debugFactories.debug('[factories] Getting factory (name: {name})', { name: String(name) });
        return this.factories[name];
    }
    /**
     * Create an instance using a registered factory
     */
    create(name, overrides) {
        debugFactories.debug('[factories] Creating instance (name: {name}, hasOverrides: {hasOverrides})', {
            name: String(name),
            hasOverrides: !!overrides,
        });
        const instance = this.factories[name](overrides);
        debugFactories.debug('[factories] Instance created (name: {name})', { name: String(name) });
        return instance;
    }
    /**
     * Create multiple instances using a registered factory
     */
    createMany(name, count, overrides) {
        debugFactories.debug('[factories] Creating multiple instances (name: {name}, count: {count})', {
            name: String(name),
            count,
        });
        const instances = createMany(this.factories[name], count, overrides);
        debugFactories.debug('[factories] {instancesLength} instances created (name: {name})', {
            instancesLength: instances.length,
            name: String(name),
        });
        return instances;
    }
}
/**
 * Create a typed factory registry with full type inference
 *
 * Following tRPC's createTRPCRouter pattern - automatically infers types
 * from the factory object structure without needing explicit type parameters.
 *
 * @param factories - Object containing factory functions
 * @returns Typed factory registry with full autocomplete
 *
 * @example
 * ```typescript
 * // Define factories with createFactory
 * const gameFactory = createFactory<Game>(() => ({
 *   id: createGameId(),
 *   name: faker.word.words(2),
 * }));
 *
 * const gameModeFactory = createFactory<GameMode>(() => ({
 *   id: createGameModeId(),
 *   name: faker.word.word(),
 * }));
 *
 * // Create registry - types are automatically inferred!
 * const gameRegistryFactories = createFactories({
 *   game: gameFactory,
 *   gameMode: gameModeFactory,
 * });
 *
 * // Full type inference and autocomplete
 * const game = gameRegistryFactories.game({ name: 'Chess' }); // Type: Game
 * const mode = gameRegistryFactories.gameMode(); // Type: GameMode
 * ```
 */
export function createFactories(factories) {
    return factories;
}
/**
 * Export faker instance for convenience
 */
export { faker } from '@faker-js/faker';
//# sourceMappingURL=factories.js.map