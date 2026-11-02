import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';
/**
 * Create an MSW server and wire it to Vitest's lifecycle hooks.
 *
 * Registers `beforeAll(listen)`, `afterEach(resetHandlers)`, and `afterAll(close)`
 * by side effect. Returns the `SetupServer` so tests can call `server.use(...)`
 * for per-test handler overrides.
 */
export function setupMswServer(options = {}) {
    const server = setupServer(...(options.handlers ?? []));
    beforeAll(() => {
        server.listen({ onUnhandledRequest: options.onUnhandledRequest ?? 'error' });
    });
    afterEach(() => {
        server.resetHandlers();
    });
    afterAll(() => {
        server.close();
    });
    return server;
}
// Re-export the common MSW authoring surface so consumers don't need a direct
// `msw` dependency. One import line per test file.
export { delay, http, HttpResponse, passthrough } from 'msw';
//# sourceMappingURL=msw.js.map