/**
 * `@arki/testing/ai/vitest` — importing this file adds `toScore` to Vitest's `expect`. Use the
 * `expect` it exports: it is the same function, typed with `toScore`.
 *
 *   await expect(summary).toScore(grounded({ source }), { judge });
 */
import { expect as vitestExpect } from 'vitest';
import { scoreMatch } from './matcher.js';
vitestExpect.extend({
    async toScore(received, scorer, options) {
        const match = await scoreMatch(received, scorer, options);
        return { pass: match.pass, message: () => match.message() };
    },
});
// Erasure seam: `expect.extend` adds the matcher at runtime; Vitest's own typing cannot say so without a global declaration.
export const expect = vitestExpect;
//# sourceMappingURL=vitest.js.map