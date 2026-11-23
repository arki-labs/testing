/**
 * The schemas that check timestamps and pages. Internal: `timestamps.ts` and `assertions.ts` parse with them, and
 * no entry exports them. The TS types (`Timestamp`, `PaginatedResponse`) are the source, so the public `.d.ts`
 * names no Zod type; `schemas.test-d.ts` locks each schema to its type both ways.
 */
import { z } from 'zod';
import { Temporal } from '@arki/date/types';
/** A `Timestamp`: a `Date` that holds a time (zod refuses `Invalid Date`), a Temporal `Instant`, or a `ZonedDateTime`. */
export declare const timestampSchema: z.ZodUnion<readonly [z.ZodDate, z.ZodInstanceOf<Temporal.Instant>, z.ZodInstanceOf<Temporal.ZonedDateTime>]>;
/** A `PaginatedResponse`: an `items` array, and `total`, `nextCursor` and `hasMore` when present. */
export declare const paginatedResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodUnknown>;
    total: z.ZodOptional<z.ZodNumber>;
    nextCursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hasMore: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map