/**
 * `await expect(output).toScore(scorer)` — the runner-neutral part. Vitest and Playwright each
 * wrap `scoreMatch` in their own `expect.extend`.
 */
import type { AiTools, Score, Scorer } from './score.js';
export type ScoreOptions<TInput = unknown, TExpected = unknown> = AiTools & {
    readonly input?: TInput;
    readonly expected?: TExpected;
};
/**
 * Thrown when a scorer could not score. Never a pass, and not turned into a pass by `.not`.
 *
 * @fix Read `score.reason`. Usually the judge or embedder is unreachable, or the output has the wrong shape. Start the judge model or fix the output, then run the test again.
 * @verify bun run test -- src/ai/ai.test.ts
 */
export declare class UnscorableError extends Error {
    readonly score: Score;
    constructor(score: Score);
}
export type ScoreMatch = {
    readonly pass: boolean;
    readonly score: Score;
    message(): string;
};
export declare function scoreMatch<TOutput, TInput, TExpected>(output: TOutput, scorer: Scorer<TOutput, TInput, TExpected>, options?: ScoreOptions<TInput, TExpected>): Promise<ScoreMatch>;
//# sourceMappingURL=matcher.d.ts.map