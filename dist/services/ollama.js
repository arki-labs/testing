/**
 * `@arki/testing/services/ollama` — the Ollama daemon already running on this machine. Host only:
 * a test never pulls a model and never starts the daemon. A missing daemon or model fails the run
 * with the command that fixes it, never a skip. The value reports each model's digest, so a report
 * can say exactly which weights answered, and a judge can be refused when it is the model under test.
 */
import { service } from '../stack/index.js';
import { nothingToStop } from './labels.js';
export const ollama = (options) => service({
    name: 'ollama',
    scope: 'run',
    async start() {
        const url = options.url ?? 'http://127.0.0.1:11434';
        const asked = [
            ...new Set([
                ...(options.models ?? []),
                ...(options.judge === undefined ? [] : [options.judge]),
                ...(options.embedding === undefined ? [] : [options.embedding]),
            ]),
        ];
        const installed = new Map();
        try {
            const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) });
            // Erasure seam: /api/tags has a fixed shape; only `models[].name` and `.digest` are read, defensively.
            const answer = (await response.json());
            for (const model of answer.models ?? []) {
                if (model.name !== undefined)
                    installed.set(model.name, model.digest ?? '');
            }
        }
        catch (error) {
            throw new Error(`OLLAMA_NOT_RUNNING: nothing answered at ${url}. Start it with \`ollama serve\`.`, {
                cause: error,
            });
        }
        const missing = asked.filter(model => !installed.has(model));
        if (missing.length > 0) {
            throw new Error(`OLLAMA_MODEL_MISSING: ${missing.join(', ')}. Pull with ${missing.map(model => `\`ollama pull ${model}\``).join(' and ')}.`);
        }
        const digests = Object.fromEntries(asked.map(model => [model, installed.get(model) ?? '']));
        return {
            value: { url, models: asked, judge: options.judge ?? null, embedding: options.embedding ?? null, digests },
            stop: nothingToStop,
        };
    },
});
//# sourceMappingURL=ollama.js.map