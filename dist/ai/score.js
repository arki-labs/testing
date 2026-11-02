export const defineScorer = (scorer) => scorer;
export function resolveFromSample(value, sample) {
    return typeof value === 'function' ? value(sample) : value;
}
export const scored = (name, value, pass, reason, details) => details === undefined
    ? { name, status: 'scored', value, pass, reason }
    : { name, status: 'scored', value, pass, reason, details };
export const unscorable = (name, reason) => ({ name, status: 'unscorable', reason });
export function requireJudge(tools, scorer) {
    if (tools.judge === undefined) {
        throw new Error(`JUDGE_REQUIRED: ${scorer} is a judge scorer. Pass a judge: expect(output).toScore(scorer, { judge }).`);
    }
    return tools.judge;
}
export function requireEmbedder(tools, scorer) {
    if (tools.embedder === undefined) {
        throw new Error(`EMBEDDER_REQUIRED: ${scorer} needs an embedder. Pass one: expect(output).toScore(scorer, { embedder }).`);
    }
    return tools.embedder;
}
//# sourceMappingURL=score.js.map