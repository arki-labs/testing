/**
 * `@arki/testing/ai/vitest` — importing this file adds `toScore` to Vitest's `expect`. Use the
 * `expect` it exports: it is the same function, typed with `toScore`.
 *
 *   await expect(summary).toScore(grounded({ source }), { judge });
 */
import { expect as vitestExpect } from 'vitest';
import type { ScoreOptions } from './matcher.js';
import type { Scorer } from './score.js';
export type ScoreAssertion<TOutput> = {
    /** Same matcher, negated. A scorer that cannot score still throws: missing evidence is never a pass. */
    readonly not: ScoreAssertion<TOutput>;
    /** Fails when the scorer scores below its bar, and when it cannot score at all. */
    toScore<TInput = unknown, TExpected = unknown>(scorer: Scorer<TOutput, TInput, TExpected>, options?: ScoreOptions<TInput, TExpected>): Promise<void>;
};
export type AiExpect = Omit<typeof vitestExpect, never> & (<TOutput>(actual: TOutput, message?: string) => ReturnType<typeof vitestExpect<TOutput>> & ScoreAssertion<TOutput>);
export declare const expect: AiExpect;
//# sourceMappingURL=vitest.d.ts.map