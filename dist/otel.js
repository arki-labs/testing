/**
 * In-memory OpenTelemetry capture for one test: finished spans with their parents, and collected metrics.
 *
 * @packageDocumentation
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { context, createContextKey, metrics, ROOT_CONTEXT, trace } from '@opentelemetry/api';
import { AggregationTemporality, MeterProvider, MetricReader } from '@opentelemetry/sdk-metrics';
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
/**
 * Propagates the active context through `await` with `AsyncLocalStorage` (Node, Bun and Deno).
 * Installed only when no context manager propagates context yet.
 */
class AsyncContextManager {
    storage = new AsyncLocalStorage();
    active() {
        return this.storage.getStore() ?? ROOT_CONTEXT;
    }
    with(current, callback, receiver, ...args) {
        return this.storage.run(current, () => callback.apply(receiver, args));
    }
    // Span capture needs `with` only; binding emitters and callbacks is what auto-instrumentations use.
    bind(_current, target) {
        return target;
    }
    enable() {
        return this;
    }
    disable() {
        this.storage.disable();
        return this;
    }
}
/** Reads metrics on demand: no timer, no exporter. Cumulative, so two reads in a row agree. */
class OnDemandMetricReader extends MetricReader {
    constructor() {
        super({ aggregationTemporalitySelector: () => AggregationTemporality.CUMULATIVE });
    }
    onForceFlush() {
        return Promise.resolve();
    }
    onShutdown() {
        return Promise.resolve();
    }
}
const probeKey = createContextKey('@arki/testing/otel probe');
/** True when the registered context manager carries a value into a callback (the no-op one does not). */
function contextPropagates() {
    return context.with(ROOT_CONTEXT.setValue(probeKey, true), () => context.active().getValue(probeKey) === true);
}
// `setGlobal*` returns false when a provider is registered already; the capture then replaces it
// and reports `true`, so dispose puts the earlier one back.
function replaceTracerProvider(provider) {
    if (trace.setGlobalTracerProvider(provider))
        return false;
    trace.disable();
    trace.setGlobalTracerProvider(provider);
    return true;
}
function replaceMeterProvider(reader) {
    const provider = new MeterProvider({ readers: [reader] });
    if (metrics.setGlobalMeterProvider(provider))
        return false;
    metrics.disable();
    metrics.setGlobalMeterProvider(provider);
    return true;
}
function spanNames(spans) {
    return spans.length === 0 ? '(none)' : spans.map(span => span.name).join(', ');
}
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
export function captureSpans() {
    const exporter = new InMemorySpanExporter();
    const tracerProvider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
    const previousTracerProvider = trace.getTracerProvider();
    const previousMeterProvider = metrics.getMeterProvider();
    const hadTracerProvider = replaceTracerProvider(tracerProvider);
    let reader = new OnDemandMetricReader();
    const hadMeterProvider = replaceMeterProvider(reader);
    const installedContextManager = !contextPropagates();
    if (installedContextManager)
        context.setGlobalContextManager(new AsyncContextManager());
    const captured = new Map();
    function capture(span) {
        const known = captured.get(span);
        if (known)
            return known;
        const parentId = span.parentSpanContext?.spanId;
        const traceId = span.spanContext().traceId;
        const wrapped = {
            name: span.name,
            kind: span.kind,
            spanContext: () => span.spanContext(),
            parentSpanContext: span.parentSpanContext,
            startTime: span.startTime,
            endTime: span.endTime,
            status: span.status,
            attributes: span.attributes,
            links: span.links,
            events: span.events,
            duration: span.duration,
            ended: span.ended,
            resource: span.resource,
            instrumentationScope: span.instrumentationScope,
            droppedAttributesCount: span.droppedAttributesCount,
            droppedEventsCount: span.droppedEventsCount,
            droppedLinksCount: span.droppedLinksCount,
            // Read when asked: a parent ends after its children, so it is not exported yet when a child is.
            get parent() {
                if (parentId === undefined)
                    return;
                const parent = exporter
                    .getFinishedSpans()
                    .find(candidate => candidate.spanContext().spanId === parentId && candidate.spanContext().traceId === traceId);
                return parent === undefined ? undefined : capture(parent);
            },
        };
        captured.set(span, wrapped);
        return wrapped;
    }
    function finished() {
        return exporter.getFinishedSpans().map(span => capture(span));
    }
    return {
        /** Every finished span, in the order they ended. */
        get finished() {
            return finished();
        },
        /**
         * The one finished span called `name`. Throws, failing the test, when none or several have that name;
         * the message lists every finished span.
         */
        named(name) {
            const all = exporter.getFinishedSpans();
            const matches = all.filter(span => span.name === name);
            const [only] = matches;
            if (matches.length !== 1 || only === undefined)
                throw new Error(`captureSpans: expected exactly one finished span named "${name}", found ${String(matches.length)}. Finished spans: ${spanNames(all)}.`);
            return capture(only);
        },
        /** The finished spans started directly under `span`, in the order they ended. `span` may still be open. */
        childrenOf(span) {
            const { spanId, traceId } = span.spanContext();
            return finished().filter(child => child.parentSpanContext?.spanId === spanId && child.spanContext().traceId === traceId);
        },
        /**
         * Collects every metric recorded since the capture started (or since `reset()`), as cumulative
         * values. Throws when an observable instrument's callback failed during collection.
         */
        async collectMetrics() {
            const { resourceMetrics, errors } = await reader.collect();
            if (errors.length > 0)
                throw new AggregateError(errors, 'captureSpans: metric collection failed');
            return resourceMetrics.scopeMetrics.flatMap(scope => scope.metrics);
        },
        /**
         * Forgets the finished spans and starts a fresh meter provider, so later reads see only what
         * happens next. An instrument created before `reset()` keeps writing to the old provider.
         */
        reset() {
            exporter.reset();
            captured.clear();
            reader = new OnDemandMetricReader();
            replaceMeterProvider(reader);
        },
        /** Restores the tracer and meter providers registered before the capture, and removes its context manager. */
        [Symbol.dispose]() {
            trace.disable();
            if (hadTracerProvider)
                trace.setGlobalTracerProvider(previousTracerProvider);
            metrics.disable();
            if (hadMeterProvider)
                metrics.setGlobalMeterProvider(previousMeterProvider);
            if (installedContextManager)
                context.disable();
        },
    };
}
//# sourceMappingURL=otel.js.map