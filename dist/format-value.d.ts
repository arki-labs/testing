/**
 * A value as JSON text for a log line or an assertion message. Never throws, so a helper that only
 * reports a value cannot fail on it: a bigint prints as `12n`, and a value JSON cannot hold (a cycle, a
 * throwing `toJSON`) prints as its tag, such as `[object Object]`. Internal: not a package export.
 */
export declare function formatValue(value: unknown, indent?: number): string;
//# sourceMappingURL=format-value.d.ts.map