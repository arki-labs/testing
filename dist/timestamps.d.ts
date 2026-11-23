/**
 * Timestamp assertions that accept every moment type an app stores
 *
 * Apps hold timestamps as `Date` (Drizzle `timestamp`) or as `@arki/date`
 * Temporal values (`Instant`, or `ZonedDateTime`). These helpers read all three
 * through their exact epoch in nanoseconds, so they never lose precision and
 * never depend on a time zone.
 */
import type { Temporal } from '@arki/date/types';
/** A moment in time: a `Date`, or a Temporal `Instant` or `ZonedDateTime`. */
export type Timestamp = Date | Temporal.Instant | Temporal.ZonedDateTime;
/** An object with the two timestamps every table row carries. */
export type Timestamps = {
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
/** Whether a value is a `Date` (not `Invalid Date`), `Instant` or `ZonedDateTime`. */
export declare function isTimestamp(value: unknown): value is Timestamp;
/** Name the kind of a value that failed `isTimestamp`, for an error message. */
export declare function describeKind(value: unknown): string;
/**
 * The exact epoch of a timestamp in nanoseconds, whatever its kind.
 *
 * @throws FailureError `ARKI_FAILURE_E008` (invariant) for an `Invalid Date`: it holds no moment. Check
 *   untrusted values with {@link isTimestamp} first.
 */
export declare function epochNanoseconds(value: Timestamp): bigint;
/**
 * The epoch of a timestamp in whole milliseconds, rounded toward the past.
 *
 * @throws FailureError `ARKI_FAILURE_E008` (invariant) for an `Invalid Date`, as {@link epochNanoseconds}.
 */
export declare function epochMilliseconds(value: Timestamp): number;
/**
 * Assert that an object has valid createdAt and updatedAt timestamps.
 *
 * @throws Error if the value is not an object, or a timestamp is missing, is not
 *   a `Date`, `Instant` or `ZonedDateTime`, or is an invalid `Date`
 */
export declare function assertTimestamps(obj: unknown): asserts obj is Timestamps;
/**
 * Assert that updatedAt is greater than or equal to createdAt.
 *
 * @throws Error if updatedAt is before createdAt
 * @throws FailureError `ARKI_FAILURE_E008` (invariant) if either is an `Invalid Date`
 */
export declare function assertUpdatedAfterCreated(obj: Timestamps): void;
//# sourceMappingURL=timestamps.d.ts.map