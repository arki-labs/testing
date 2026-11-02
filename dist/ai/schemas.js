import { is, recordSchema, withJsonSchema } from '@arki/schema';
function schemaOf(json, read, shape) {
    const validator = {
        '~standard': {
            version: 1,
            vendor: 'arki-testing',
            validate(value) {
                const checked = read(value);
                return checked === null ? { issues: [{ message: `expected ${shape}` }] } : { value: checked };
            },
        },
    };
    return withJsonSchema(validator, json);
}
export const verdictSchema = schemaOf({
    type: 'object',
    properties: { pass: { type: 'boolean' }, reason: { type: 'string' } },
    required: ['pass', 'reason'],
}, value => is(value, recordSchema) && typeof value['pass'] === 'boolean' && typeof value['reason'] === 'string'
    ? { pass: value['pass'], reason: value['reason'] }
    : null, '{ pass: boolean, reason: string }');
export const claimsSchema = schemaOf({
    type: 'object',
    properties: {
        claims: {
            type: 'array',
            items: {
                type: 'object',
                properties: { claim: { type: 'string' }, supported: { type: 'boolean' }, quote: { type: 'string' } },
                required: ['claim', 'supported', 'quote'],
            },
        },
    },
    required: ['claims'],
}, value => {
    if (!is(value, recordSchema) || !Array.isArray(value['claims']))
        return null;
    const claims = [];
    const items = value['claims'];
    for (const item of items) {
        if (!is(item, recordSchema) ||
            typeof item['claim'] !== 'string' ||
            typeof item['supported'] !== 'boolean' ||
            typeof item['quote'] !== 'string')
            return null;
        claims.push({ claim: item['claim'], supported: item['supported'], quote: item['quote'] });
    }
    return { claims };
}, '{ claims: { claim: string, supported: boolean, quote: string }[] }');
/** What `GET /api/tags` returns that the kit reads: each installed model's name and digest. */
export const tagsAnswerSchema = schemaOf({
    type: 'object',
    properties: {
        models: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' }, digest: { type: 'string' } } },
        },
    },
}, value => {
    if (!is(value, recordSchema))
        return null;
    const listed = value['models'] ?? [];
    if (!Array.isArray(listed))
        return null;
    const models = [];
    const items = listed;
    for (const item of items) {
        if (!is(item, recordSchema))
            return null;
        // A model without a name or a digest cannot be matched, so it is left out rather than failing the list.
        if (typeof item['name'] === 'string' && typeof item['digest'] === 'string')
            models.push({ name: item['name'], digest: item['digest'] });
    }
    return { models };
}, '{ models?: { name: string, digest: string }[] }');
/** What `POST /api/chat` returns that the judge reads: the text of the answer. */
export const chatAnswerSchema = schemaOf({ type: 'object', properties: { message: { type: 'object', properties: { content: { type: 'string' } } } } }, value => {
    if (!is(value, recordSchema))
        return null;
    const message = value['message'];
    return is(message, recordSchema) && typeof message['content'] === 'string' ? { content: message['content'] } : null;
}, '{ message: { content: string } }');
/** What `POST /api/embed` returns that the embedder reads: one vector of numbers per text. */
export const embedAnswerSchema = schemaOf({ type: 'object', properties: { embeddings: { type: 'array', items: { type: 'array', items: { type: 'number' } } } } }, value => {
    if (!is(value, recordSchema) || !Array.isArray(value['embeddings']))
        return null;
    const embeddings = [];
    const vectors = value['embeddings'];
    for (const vector of vectors) {
        if (!Array.isArray(vector))
            return null;
        const numbers = vector;
        const checked = [];
        for (const entry of numbers) {
            if (typeof entry !== 'number')
                return null;
            checked.push(entry);
        }
        embeddings.push(checked);
    }
    return { embeddings };
}, '{ embeddings: number[][] }');
//# sourceMappingURL=schemas.js.map