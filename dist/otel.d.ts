import type { Span } from '@opentelemetry/api';
import type { MetricData } from '@opentelemetry/sdk-metrics';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';
/**
 * A finished span as the SDK exported it, plus its finished parent.
 *
 * @example
 * ```ts
 * import { trace } from '@opentelemetry/api';
 * import { captureSpans } from '@arki/testing/otel';
 *
 * using spans = captureSpans();
 * trace.getTracer('example').startActiveSpan('outer', outer => {
 *   trace.getTracer('example').startSpan('inner').end();
 *   outer.end();
 * });
 * const parentName: string | undefined = spans.named('inner').parent?.name; // 'outer'
 * ```
 */
export type CapturedSpan = ReadableSpan & {
    /** The finished span this span was started under, or `undefined` for a root span or a parent that has not ended. */
    readonly parent: CapturedSpan | undefined;
};
/**
 * Installs an in-memory tracer provider and meter provider as the OpenTelemetry globals for one test,
 * and an `AsyncLocalStorage` context manager when none is registered. Disposing the capture restores
 * the providers that were registered before, so `using spans = captureSpans()` scopes it to a block.
 *
 * Code under test must get its tracer and meter after the capture starts (`trace.getTracer(...)`
 * inside the operation, as `@arki/*` helpers do). A tracer cached earlier keeps the provider it came from.
 *
 * @example
 * ```ts
 * import { metrics, trace } from '@opentelemetry/api';
 * import { captureSpans } from '@arki/testing/otel';
 *
 * using spans = captureSpans();
 * const tracer = trace.getTracer('example');
 * await tracer.startActiveSpan('db.unit_of_work', async unit => {
 *   await tracer.startActiveSpan('db.transaction', async transaction => {
 *     metrics.getMeter('example').createCounter('db.operations').add(1, { outcome: 'success' });
 *     transaction.end();
 *   });
 *   unit.end();
 * });
 * const parentName = spans.named('db.transaction').parent?.name; // 'db.unit_of_work'
 * const children = spans.childrenOf(spans.named('db.unit_of_work')).map(span => span.name); // ['db.transaction']
 * const counters = (await spans.collectMetrics()).filter(metric => metric.descriptor.name === 'db.operations');
 * spans.reset(); // forget the spans and metrics recorded so far
 * ```
 */
export declare function captureSpans(): {
    /** Every finished span, in the order they ended. */
    readonly finished: readonly CapturedSpan[];
    /**
     * The one finished span called `name`. Throws, failing the test, when none or several have that name;
     * the message lists every finished span.
     */
    named(name: string): CapturedSpan;
    /** The finished spans started directly under `span`, in the order they ended. `span` may still be open. */
    childrenOf(span: Pick<Span, 'spanContext'>): readonly CapturedSpan[];
    /**
     * Collects every metric recorded since the capture started (or since `reset()`), as cumulative
     * values. Throws when an observable instrument's callback failed during collection.
     */
    collectMetrics(): Promise<readonly MetricData[]>;
    /**
     * Forgets the finished spans and starts a fresh meter provider, so later reads see only what
     * happens next. An instrument created before `reset()` keeps writing to the old provider.
     */
    reset(): void;
    /** Restores the tracer and meter providers registered before the capture, and removes its context manager. */
    [Symbol.dispose](): void;
};
/** The capture `captureSpans()` returns. */
export type SpanCapture = ReturnType<typeof captureSpans>;
//# sourceMappingURL=otel.d.ts.map