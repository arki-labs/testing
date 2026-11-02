/**
 * `@arki/testing/services/http-fixtures` — a small local HTTP server for the things an app fetches
 * from the outside world: an RSS feed, a web page, a webhook target. The app under test makes a
 * real request to a real socket; only the other end is a fixture.
 *
 * It starts once per run, in the runner process, and every worker's app server reaches it by the
 * same URL. Because workers share it, the handler must answer from the request alone: put what
 * varies (which feed, which failure) in the path or query, never in the handler's memory.
 */
import { createServer } from 'node:http';
import { service } from '../stack/index.js';
import { once } from './labels.js';
function toRequest(incoming, origin) {
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
        if (value === undefined)
            continue;
        headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    return new Request(new URL(incoming.url ?? '/', origin), { method: incoming.method ?? 'GET', headers });
}
async function send(response, outgoing) {
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
}
export const httpFixtures = (options) => service({
    name: options.name ?? 'http-fixtures',
    scope: 'run',
    async start() {
        const server = createServer((incoming, outgoing) => {
            const origin = `http://${incoming.headers.host ?? 'localhost'}`;
            (async () => send(await options.handle(toRequest(incoming, origin)), outgoing))()
                .catch((error) => {
                outgoing.writeHead(500, { 'content-type': 'text/plain' });
                outgoing.end(`FIXTURE_HANDLER_FAILED: ${error instanceof Error ? error.message : String(error)}`);
            });
        });
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        const { port } = server.address();
        return {
            value: { url: `http://127.0.0.1:${port}` },
            stop: once(() => new Promise(resolve => {
                server.close(() => resolve());
                server.closeAllConnections();
            })),
        };
    },
});
//# sourceMappingURL=http-fixtures.js.map