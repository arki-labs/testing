/**
 * `e2eConfig({ stack })` — the Playwright config for an app on its real stack. The capability
 * lives here; the policy (workers, retries, reporters) comes from `@arki/playwright-config`.
 */
import type { PlaywrightTestConfig } from '@playwright/test';
export type E2EConfigOptions = {
    /** Path to the app's `globalSetup` file, which default-exports `stackSetup(stack, ...)`. */
    readonly globalSetup: string;
    /** Policy from `tooling/playwright`, spread under the stack-specific settings. */
    readonly policy?: PlaywrightTestConfig;
    readonly testDir?: string;
    /** Which files are specs. Default Playwright's `*.spec.ts`. */
    readonly testMatch?: PlaywrightTestConfig['testMatch'];
    /** Time for one test. Default 3 minutes. */
    readonly testTimeoutMs?: number;
};
export declare function e2eConfig(options: E2EConfigOptions): PlaywrightTestConfig;
//# sourceMappingURL=config.d.ts.map