/**
 * `@arki/testing/e2e` — Playwright end-to-end tests that boot a built app against the real stack: config, setup, story helpers and request holds.
 */
export { e2eConfig } from './config.js';
export { SERVER_ROOT_ENV_KEY, stackSetup } from './setup.js';
export { holdRequests } from './hold.js';
export { ensureBuilt } from './server.js';
export { e2eTest, storyFor } from './test.js';
//# sourceMappingURL=index.js.map