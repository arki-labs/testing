/**
 * The answer shapes the judge reads from Ollama, as zod schemas. The two the judge asks for (`verdictSchema`,
 * `claimsSchema`) also describe themselves as JSON Schema through zod's Standard JSON Schema support: Ollama
 * constrains its output with it. Internal: the TS types in `answers.ts` are the source, and
 * `../schemas.test-d.ts` locks `verdictSchema` and `checkedClaimSchema` to them.
 */
import { z } from 'zod';
export declare const verdictSchema: z.ZodObject<{
    pass: z.ZodBoolean;
    reason: z.ZodString;
}, z.core.$strip>;
export declare const checkedClaimSchema: z.ZodObject<{
    claim: z.ZodString;
    supported: z.ZodBoolean;
    quote: z.ZodString;
}, z.core.$strip>;
export declare const claimsSchema: z.ZodObject<{
    claims: z.ZodArray<z.ZodObject<{
        claim: z.ZodString;
        supported: z.ZodBoolean;
        quote: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * What `GET /api/tags` returns that the kit reads: each installed model's name and digest. A model without a
 * name or a digest cannot be matched, so it is left out rather than failing the list; a missing list is empty.
 */
export declare const tagsAnswerSchema: z.ZodPipe<z.ZodObject<{
    models: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        name: z.ZodString;
        digest: z.ZodString;
    }, z.core.$strip>, z.ZodPipe<z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodTransform<null, Record<string, unknown>>>]>>>>;
}, z.core.$strip>, z.ZodTransform<{
    models: {
        name: string;
        digest: string;
    }[];
}, {
    models?: ({
        name: string;
        digest: string;
    } | null)[] | null | undefined;
}>>;
/** What `POST /api/chat` returns that the judge reads: the text of the answer. */
export declare const chatAnswerSchema: z.ZodPipe<z.ZodObject<{
    message: z.ZodObject<{
        content: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodTransform<{
    content: string;
}, {
    message: {
        content: string;
    };
}>>;
/** What `POST /api/embed` returns that the embedder reads: one vector of numbers per text. */
export declare const embedAnswerSchema: z.ZodObject<{
    embeddings: z.ZodArray<z.ZodArray<z.ZodNumber>>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map