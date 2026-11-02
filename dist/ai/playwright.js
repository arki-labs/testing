/**
 * `@arki/testing/ai/playwright` — Playwright's `expect` with `toScore`.
 *
 *   await expect(summary).toScore(grounded({ source }), { judge });
 */
import { expect as playwrightExpect } from '@playwright/test';
import { scoreMatch } from './matcher.js';
export const expect = playwrightExpect.extend({
    async toScore(received, scorer, options) {
        const match = await scoreMatch(received, scorer, options);
        return { pass: match.pass, message: () => match.message(), name: 'toScore' };
    },
});
//# sourceMappingURL=playwright.js.map