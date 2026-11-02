/**
 * The judge and the embedder: small clients for the local Ollama daemon, seeded and at
 * temperature 0 so the same input gives the same answer. A judge is built from a model name and
 * refuses to be the model under test.
 */
import type { FailureOf } from '@arki/failure';
import type { SchemaWithJson } from '@arki/schema';
import type { Verdict } from './schemas.js';
export type { Verdict } from './schemas.js';
/**
 * Ollama did not answer: it is not running, the call timed out, or it answered with an error status.
 * A scorer turns it into an `unscorable` score, so a missing judge is never read as a pass or a zero.
 *
 * @fix Start the daemon with `ollama serve`, check the model is pulled, or raise `timeoutMs`.
 * @verify cd packages/testing && bun run vitest run src/ai/judge.test.ts
 */
export declare const OllamaUnavailable: import("@arki/failure").FailureDefinition<"testing.ollama_unavailable", undefined>;
/**
 * Ollama answered, but not in the shape the call asked for: the chat text is not JSON, it does not match the
 * schema, or the embed answer is not one vector per text.
 *
 * @fix Use a stronger judge model, or shorten the text so the answer is not cut off at `maxTokens`.
 * @verify cd packages/testing && bun run vitest run src/ai/judge.test.ts
 */
export declare const OllamaAnswerInvalid: import("@arki/failure").FailureDefinition<"testing.ollama_answer_invalid", undefined>;
/** Every failure a judge or an embedder call returns. */
export declare const OLLAMA_FAILURES: readonly [import("@arki/failure").FailureDefinition<"testing.ollama_unavailable", undefined>, import("@arki/failure").FailureDefinition<"testing.ollama_answer_invalid", undefined>];
/** A failure value returned by a judge or an embedder call. */
export type OllamaFailure = FailureOf<(typeof OLLAMA_FAILURES)[number]>;
export type Judge = {
    readonly model: string;
    /** The weights that answered, from Ollama. A report names it so a diff can refuse to compare across judges. */
    readonly digest: string;
    /** A binary verdict on `output` against `rubric`. `reason` is the critique. */
    verdict(input: {
        readonly rubric: string;
        readonly output: string;
        readonly input?: string;
        readonly source?: string;
    }): Promise<Verdict | OllamaFailure>;
    /** Structured extraction for scorers where the judge extracts and code decides. */
    extract<TOutput>(input: {
        readonly system: string;
        readonly prompt: string;
        readonly schema: SchemaWithJson<unknown, TOutput>;
    }): Promise<TOutput | OllamaFailure>;
};
export type Embedder = {
    readonly model: string;
    embed(texts: readonly string[]): Promise<readonly (readonly number[])[] | OllamaFailure>;
};
export type JudgeOptions = {
    /** Default `http://127.0.0.1:11434`. */
    readonly url?: string;
    readonly model: string;
    /** The model the AI under test runs on. A judge with the same digest is refused. */
    readonly target?: string;
    /** Let the judge be the model under test. It grades its own work more kindly; say so in the test. */
    readonly allowSameModelAsJudge?: boolean;
    /** Default 7. */
    readonly seed?: number;
    /** Tokens the judge may write per call. Default 1500. */
    readonly maxTokens?: number;
    /** How long a chat or embed call may take before it is `OllamaUnavailable`. Default 120 000. */
    readonly timeoutMs?: number;
};
/**
 * The digest of an installed model, or `undefined` when Ollama does not list it (a cloud model, say).
 * Throws `OLLAMA_NOT_RUNNING` when nothing answers: a run cannot start without its daemon.
 */
export declare function digestOf(url: string, model: string): Promise<string | undefined>;
export declare function createJudge(options: JudgeOptions): Promise<Judge>;
export declare function createEmbedder(options: {
    readonly url?: string;
    readonly model: string;
    /** How long an embed call may take before it is `OllamaUnavailable`. Default 120 000. */
    readonly timeoutMs?: number;
}): Promise<Embedder>;
/** Cosine similarity of two vectors: 1 for the same direction, 0 for unrelated. */
export declare function cosine(a: readonly number[], b: readonly number[]): number;
//# sourceMappingURL=judge.d.ts.map