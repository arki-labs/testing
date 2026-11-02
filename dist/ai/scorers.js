/**
 * The shipped scorers. `shape` and `containsFacts` are plain code and may run anywhere.
 * `grounded` and `rubric` ask a judge; `similarTo` asks an embedder.
 */
import { isFailure } from '@arki/failure';
import { formatIssues } from '@arki/schema';
import { cosine } from './judge.js';
import { claimsSchema } from './schemas.js';
import { defineScorer, requireEmbedder, requireJudge, resolveFromSample, scored, unscorable } from './score.js';
/** Lowercase, drop punctuation and the commas inside numbers, collapse spaces. Quotes and facts are compared in this form. */
export function normalizeText(text) {
    return text
        .normalize('NFKC')
        .toLowerCase()
        .replaceAll(/(?<=\d),(?=\d{3}\b)/g, '')
        .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}
/** 1 when the output satisfies the schema, else 0 with the issues. Works with any Standard Schema. */
export const shape = (schema) => defineScorer({
    name: 'shape',
    kind: 'code',
    async score({ output }) {
        const result = await schema['~standard'].validate(output);
        if (result.issues === undefined)
            return scored('shape', 1, true, 'the output matches the schema');
        const issues = formatIssues(result.issues);
        return scored('shape', 0, false, `the output does not match the schema: ${issues}`, { issues });
    },
});
const GROUNDED_SYSTEM = [
    'List every discrete factual claim made by the OUTPUT (who, what, when, how many).',
    'For each claim, check it against the SOURCE.',
    'supported is true only when the SOURCE states every fact in the claim, possibly in other words, or the claim follows trivially from what the SOURCE states.',
    'supported is false when a fact is missing from the SOURCE, contradicts it, or is only a plausible inference.',
    'quote is the shortest span of the SOURCE, copied word for word, that decides the claim.',
].join(' ');
/**
 * Share of the output's claims that the source supports. The judge extracts the claims and a quote
 * for each; code checks that every quote of a supported claim really is in the source, so a
 * judge that invents a quote cannot vouch for a claim. No claims at all is `unscorable`: nothing
 * was checked, which is not the same as nothing being wrong.
 */
export const grounded = (options) => defineScorer({
    name: 'grounded',
    kind: 'judge',
    version: '1',
    async score(sample, tools) {
        const judge = requireJudge(tools, 'grounded');
        const source = resolveFromSample(options.source, sample);
        const atLeast = options.atLeast ?? 0.9;
        const maxClaims = options.maxClaims ?? 12;
        const answer = await judge.extract({
            system: `${GROUNDED_SYSTEM} List at most ${maxClaims} claims.`,
            prompt: `SOURCE:\n${source}\n\nOUTPUT:\n${sample.output}`,
            schema: claimsSchema,
        });
        if (isFailure(answer))
            return unscorable('grounded', `the judge could not answer: ${answer.message}`);
        const { claims } = answer;
        const listed = claims.slice(0, maxClaims);
        if (listed.length === 0)
            return unscorable('grounded', 'the judge found no checkable claims in the output');
        const normalizedSource = normalizeText(source);
        const checked = listed.map(entry => {
            const quoteFound = entry.quote.trim() !== '' && normalizedSource.includes(normalizeText(entry.quote));
            return {
                claim: entry.claim,
                quote: entry.quote,
                judged: entry.supported,
                quoteFound,
                supported: entry.supported && quoteFound,
            };
        });
        const supportedCount = checked.filter(entry => entry.supported).length;
        const value = supportedCount / checked.length;
        const unsupported = checked.filter(entry => !entry.supported);
        const why = (entry) => `"${entry.claim}"${entry.judged ? ' (the quote is not in the source)' : ''}`;
        return scored('grounded', value, value >= atLeast, unsupported.length === 0
            ? `all ${checked.length} claims are supported by the source`
            : `${supportedCount} of ${checked.length} claims are supported; not supported: ${unsupported.map(entry => why(entry)).join('; ')}`, { claims: checked });
    },
});
/** Share of the facts found in the output (compared without case, punctuation or the commas in numbers). */
export const containsFacts = (facts) => defineScorer({
    name: 'containsFacts',
    kind: 'code',
    score(sample) {
        const wanted = resolveFromSample(facts, sample);
        if (wanted.length === 0)
            return Promise.resolve(unscorable('containsFacts', 'no facts were given'));
        const text = normalizeText(sample.output);
        const missing = wanted.filter(fact => !text.includes(normalizeText(fact)));
        const value = (wanted.length - missing.length) / wanted.length;
        return Promise.resolve(scored('containsFacts', value, missing.length === 0, missing.length === 0
            ? `all ${wanted.length} facts are in the output`
            : `missing from the output: ${missing.map(fact => `"${fact}"`).join(', ')}`, { missing: [...missing] }));
    },
});
/**
 * Cosine similarity between the output and a reference, passing at `atLeast`. It measures the
 * gist and the topic only. It cannot tell a fact from its negation or a wrong number, so use
 * `containsFacts` or `grounded` for facts. `atLeast` has no safe default; measure it on your model.
 */
export const similarTo = (expected, options) => defineScorer({
    name: 'similarTo',
    kind: 'embedding',
    async score(sample, tools) {
        const embedder = requireEmbedder(tools, 'similarTo');
        const reference = resolveFromSample(expected, sample);
        const vectors = await embedder.embed([sample.output, reference]);
        if (isFailure(vectors))
            return unscorable('similarTo', `the embedder could not answer: ${vectors.message}`);
        const [outputVector, referenceVector] = vectors;
        if (outputVector === undefined || referenceVector === undefined)
            return unscorable('similarTo', 'the embedder returned no vectors');
        const value = cosine(outputVector, referenceVector);
        return scored('similarTo', value, value >= options.atLeast, `cosine similarity ${value.toFixed(3)} against the bar ${options.atLeast}`);
    },
});
/** One criterion in plain words. The judge answers pass or fail, and its critique is the reason. */
export const rubric = (criterion) => defineScorer({
    name: 'rubric',
    kind: 'judge',
    version: '1',
    async score(sample, tools) {
        const judge = requireJudge(tools, 'rubric');
        const verdict = await judge.verdict({ rubric: resolveFromSample(criterion, sample), output: sample.output });
        if (isFailure(verdict))
            return unscorable('rubric', `the judge could not answer: ${verdict.message}`);
        return scored('rubric', verdict.pass ? 1 : 0, verdict.pass, verdict.reason);
    },
});
//# sourceMappingURL=scorers.js.map