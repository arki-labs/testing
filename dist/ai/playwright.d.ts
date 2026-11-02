import type { ScoreOptions } from './matcher.js';
import type { Scorer } from './score.js';
export declare const expect: import("@playwright/test").Expect<{
    toScore<TOutput, TInput = unknown, TExpected = unknown>(received: TOutput, scorer: Scorer<TOutput, TInput, TExpected>, options?: ScoreOptions<TInput, TExpected>): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
}>;
//# sourceMappingURL=playwright.d.ts.map