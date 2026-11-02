import type { StandardSchemaV1 } from '@arki/schema';
import type { FromSample, Scorer } from './score.js';
/** Lowercase, drop punctuation and the commas inside numbers, collapse spaces. Quotes and facts are compared in this form. */
export declare function normalizeText(text: string): string;
/** 1 when the output satisfies the schema, else 0 with the issues. Works with any Standard Schema. */
export declare const shape: <TOutput>(schema: StandardSchemaV1<unknown, TOutput>) => Scorer<unknown>;
export type GroundedOptions<TOutput extends string, TInput, TExpected> = {
    /** The text every claim must come from. */
    readonly source: FromSample<string, TOutput, TInput, TExpected>;
    /** Share of supported claims that passes. Default 0.9. */
    readonly atLeast?: number;
    /** Claims the judge may list. Default 12. */
    readonly maxClaims?: number;
};
/**
 * Share of the output's claims that the source supports. The judge extracts the claims and a quote
 * for each; code checks that every quote of a supported claim really is in the source, so a
 * judge that invents a quote cannot vouch for a claim. No claims at all is `unscorable`: nothing
 * was checked, which is not the same as nothing being wrong.
 */
export declare const grounded: <TOutput extends string = string, TInput = unknown, TExpected = unknown>(options: GroundedOptions<TOutput, TInput, TExpected>) => Scorer<TOutput, TInput, TExpected>;
/** Share of the facts found in the output (compared without case, punctuation or the commas in numbers). */
export declare const containsFacts: <TOutput extends string = string, TInput = unknown, TExpected = unknown>(facts: FromSample<readonly string[], TOutput, TInput, TExpected>) => Scorer<TOutput, TInput, TExpected>;
/**
 * Cosine similarity between the output and a reference, passing at `atLeast`. It measures the
 * gist and the topic only. It cannot tell a fact from its negation or a wrong number, so use
 * `containsFacts` or `grounded` for facts. `atLeast` has no safe default; measure it on your model.
 */
export declare const similarTo: <TOutput extends string = string, TInput = unknown, TExpected = unknown>(expected: FromSample<string, TOutput, TInput, TExpected>, options: {
    readonly atLeast: number;
}) => Scorer<TOutput, TInput, TExpected>;
/** One criterion in plain words. The judge answers pass or fail, and its critique is the reason. */
export declare const rubric: <TOutput extends string = string, TInput = unknown, TExpected = unknown>(criterion: FromSample<string, TOutput, TInput, TExpected>) => Scorer<TOutput, TInput, TExpected>;
//# sourceMappingURL=scorers.d.ts.map