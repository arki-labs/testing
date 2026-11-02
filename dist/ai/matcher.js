/**
 * Thrown when a scorer could not score. Never a pass, and not turned into a pass by `.not`.
 *
 * @fix Read `score.reason`. Usually the judge or embedder is unreachable, or the output has the wrong shape. Start the judge model or fix the output, then run the test again.
 * @verify bun run test -- src/ai/ai.test.ts
 */
export class UnscorableError extends Error {
    score;
    constructor(score) {
        super(`UNSCORABLE: ${score.name} could not score the output: ${score.reason}`);
        this.score = score;
        this.name = 'UnscorableError';
    }
}
export async function scoreMatch(output, scorer, options = {}) {
    const { input, expected, ...tools } = options;
    // Erasure seam: a sample without an input or expectation carries `undefined`; the scorer's types say what it reads.
    const sample = { output, input, expected };
    const score = await scorer.score(sample, tools);
    if (score.status === 'unscorable')
        throw new UnscorableError(score);
    return {
        pass: score.pass,
        score,
        message: () => `${score.name} scored ${score.value.toFixed(2)} and ${score.pass ? 'passed' : 'failed'}: ${score.reason}${score.details === undefined ? '' : `\n${JSON.stringify(score.details, null, 2)}`}`,
    };
}
//# sourceMappingURL=matcher.js.map