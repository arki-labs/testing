/**
 * The two answer shapes the judge is asked for, as Standard Schemas that also describe themselves
 * as JSON Schema (Ollama constrains its output with it). Hand-written so the package needs no
 * schema library of its own.
 */
import type { SchemaWithJson } from '@arki/schema';
export type Verdict = {
    readonly pass: boolean;
    readonly reason: string;
};
export declare const verdictSchema: SchemaWithJson<unknown, Verdict>;
export type CheckedClaim = {
    readonly claim: string;
    readonly supported: boolean;
    readonly quote: string;
};
export declare const claimsSchema: SchemaWithJson<unknown, {
    readonly claims: readonly CheckedClaim[];
}>;
/** What `GET /api/tags` returns that the kit reads: each installed model's name and digest. */
export declare const tagsAnswerSchema: SchemaWithJson<unknown, {
    readonly models: readonly {
        readonly name: string;
        readonly digest: string;
    }[];
}>;
/** What `POST /api/chat` returns that the judge reads: the text of the answer. */
export declare const chatAnswerSchema: SchemaWithJson<unknown, {
    readonly content: string;
}>;
/** What `POST /api/embed` returns that the embedder reads: one vector of numbers per text. */
export declare const embedAnswerSchema: SchemaWithJson<unknown, {
    readonly embeddings: readonly (readonly number[])[];
}>;
//# sourceMappingURL=schemas.d.ts.map