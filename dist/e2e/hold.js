/**
 * Delay the real response of every request whose URL contains one of `paths`, to look at a
 * loading state. The request is only sent to the real server after `release`, so nothing is
 * faked, answered or aborted. Other requests are untouched. Call it before `page.goto`.
 * A hold that is never released ends with the page.
 */
export async function holdRequests(page, paths) {
    let released = false;
    const waiting = [];
    let markArrived = () => {
        // replaced when the route handler first runs
    };
    const arrived = new Promise(resolve => {
        markArrived = resolve;
    });
    await page.route(url => paths.some(path => url.href.includes(path)), async (route) => {
        markArrived();
        if (!released)
            await new Promise(resolve => waiting.push(resolve));
        if (!page.isClosed())
            await route.continue().catch(() => {
                // the page closed while the request was held
            });
    });
    return {
        arrived,
        async release() {
            released = true;
            for (const resume of waiting.splice(0))
                resume();
        },
    };
}
//# sourceMappingURL=hold.js.map