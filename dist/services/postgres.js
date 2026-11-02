/**
 * `@arki/testing/services/postgres` — one Postgres container per run, one migrated template
 * database, and one clone of it per worker (`CREATE DATABASE … TEMPLATE`, tens of milliseconds).
 */
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';
import { service } from '../stack/index.js';
import { nothingToStop, once, RUN_LABEL, safeId } from './labels.js';
function withDatabase(adminUrl, database) {
    const url = new URL(adminUrl);
    url.pathname = `/${database}`;
    return url.toString();
}
async function withClient(url, run) {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
        return await run(client);
    }
    finally {
        await client.end();
    }
}
/** Empties every table in `url`, restarting identities. Use between tests that share a worker. */
export async function truncateAll(url) {
    await withClient(url, async (client) => {
        const tables = await client.query(`SELECT quote_ident(schemaname) || '.' || quote_ident(tablename) AS name
         FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')`);
        if (tables.rows.length === 0)
            return;
        await client.query(`TRUNCATE ${tables.rows.map(row => row.name).join(', ')} RESTART IDENTITY CASCADE`);
    });
}
export const postgres = (options) => service({
    name: 'postgres',
    scope: 'run',
    async start(ctx) {
        const container = await new PostgreSqlContainer(options.image ?? 'postgres:17-alpine')
            .withDatabase('postgres')
            .withLabels({ [RUN_LABEL]: ctx.runId })
            .start();
        const stop = once(() => container.stop());
        try {
            const adminUrl = container.getConnectionUri();
            const templateDb = `tpl_${safeId(ctx.runId)}`;
            await withClient(adminUrl, client => client.query(`CREATE DATABASE ${templateDb}`));
            await options.buildSchema(withDatabase(adminUrl, templateDb));
            // Nobody may be connected to a template while it is cloned.
            await withClient(adminUrl, client => client.query(`ALTER DATABASE ${templateDb} IS_TEMPLATE true; ALTER DATABASE ${templateDb} ALLOW_CONNECTIONS false`));
            return { value: { adminUrl, templateDb }, stop };
        }
        catch (error) {
            await stop();
            throw error;
        }
    },
    async slice(run, ctx) {
        const database = `w${ctx.workerIndex}_${safeId(ctx.runId)}`;
        await withClient(run.adminUrl, client => client.query(`CREATE DATABASE ${database} TEMPLATE ${run.templateDb}`));
        return {
            value: { url: withDatabase(run.adminUrl, database), database },
            stop: once(async () => {
                await withClient(run.adminUrl, client => client.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`)).catch(nothingToStop);
            }),
        };
    },
});
//# sourceMappingURL=postgres.js.map