export type MailpitWorker = {
    readonly httpUrl: string;
};
export declare const mailpit: (options?: {
    readonly image?: string;
}) => import("../stack/index.js").ServiceSpec<null, MailpitWorker>;
export type MailSummary = {
    readonly id: string;
    readonly subject: string;
    readonly to: readonly string[];
};
/** One mail, read in full. */
export type ReceivedMail = MailSummary & {
    readonly text: string;
    readonly html: string;
    /** Every `http(s)` link in the HTML part, in order. */
    links(): readonly string[];
};
export type Mailbox = {
    /** Mails to `to` (an exact address) or all mails when omitted. Oldest first. */
    all(to?: string): Promise<readonly MailSummary[]>;
    /**
     * Waits until a mail to `to` whose subject matches arrives, and returns it in full.
     * Polls Mailpit; on timeout the error lists what Mailpit does hold (MAIL_NOT_RECEIVED).
     */
    waitFor(match: {
        readonly to: string;
        readonly subject?: string | RegExp;
        readonly timeoutMs?: number;
    }): Promise<ReceivedMail>;
    /** Deletes the mails to `to`, or every mail when omitted. */
    clear(to?: string): Promise<void>;
};
export declare function mailbox(httpUrl: string): Mailbox;
//# sourceMappingURL=mailpit.d.ts.map