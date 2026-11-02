import type { Page } from '@playwright/test';
/** A hold on requests to the app: they wait at the browser until `release`, then go to the real server. */
export type RequestHold = {
    /** Resolves once a held request has arrived, so a test knows the page is really waiting. */
    readonly arrived: Promise<void>;
    /** Lets every held request (and every later one) through to the real server. */
    release(): Promise<void>;
};
/**
 * Delay the real response of every request whose URL contains one of `paths`, to look at a
 * loading state. The request is only sent to the real server after `release`, so nothing is
 * faked, answered or aborted. Other requests are untouched. Call it before `page.goto`.
 * A hold that is never released ends with the page.
 */
export declare function holdRequests(page: Page, paths: readonly string[]): Promise<RequestHold>;
//# sourceMappingURL=hold.d.ts.map