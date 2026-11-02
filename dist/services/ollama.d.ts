export type OllamaValue = {
    readonly url: string;
    /** Every model the run asked for, `judge` and `embedding` included. */
    readonly models: readonly string[];
    /** The judge model, or `null` when the run asked for none. */
    readonly judge: string | null;
    /** The embedding model, or `null` when the run asked for none. */
    readonly embedding: string | null;
    /** Model name to digest, for every model the run asked for. */
    readonly digests: Readonly<Record<string, string>>;
};
export type OllamaOptions = {
    /** Default `http://127.0.0.1:11434`. */
    readonly url?: string;
    /** Models the run needs, for example `qwen3:0.6b`. */
    readonly models?: readonly string[];
    /** The model that judges AI output. Checked like `models`. */
    readonly judge?: string;
    /** The model that embeds text for `similarTo`. Checked like `models`. */
    readonly embedding?: string;
};
export declare const ollama: (options: OllamaOptions) => import("../stack/index.js").ServiceSpec<OllamaValue, OllamaValue>;
//# sourceMappingURL=ollama.d.ts.map