import type { ServiceMap, Stack } from '../stack/index.js';
import type { ServerOptions } from './server.js';
/** The env name of the folder this run's servers start in. Read it where `serve.cwd` is written. */
export declare const SERVER_ROOT_ENV_KEY = "ARKI_SERVER_ROOT";
export declare function stackSetup<M extends ServiceMap>(stack: Stack<M>, options: Pick<ServerOptions, 'build'>): () => Promise<() => Promise<void>>;
//# sourceMappingURL=setup.d.ts.map