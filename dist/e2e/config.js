export function e2eConfig(options) {
    return {
        ...options.policy,
        testDir: options.testDir ?? './e2e',
        ...(options.testMatch === undefined ? {} : { testMatch: options.testMatch }),
        globalSetup: options.globalSetup,
        // The stack is real, so the server and the model are slow once per worker, not per test.
        timeout: options.testTimeoutMs ?? 180_000,
        use: { ...options.policy?.use, trace: 'on-first-retry', screenshot: 'only-on-failure' },
    };
}
//# sourceMappingURL=config.js.map