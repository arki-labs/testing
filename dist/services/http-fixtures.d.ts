export type HttpFixturesValue = {
    readonly url: string;
};
export type HttpFixturesOptions = {
    /** The service name in error messages. Default `http-fixtures`. */
    readonly name?: string;
    /** Answers one request. */
    readonly handle: (request: Request) => Response | Promise<Response>;
};
export declare const httpFixtures: (options: HttpFixturesOptions) => import("../stack/index.js").ServiceSpec<HttpFixturesValue, HttpFixturesValue>;
//# sourceMappingURL=http-fixtures.d.ts.map