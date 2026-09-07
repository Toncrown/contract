import * as fs from 'fs';

/**
 * TON API v2, as parsed by @ton/ton, does not type the items of a nested tuple. Tact
 * nests a struct past its fourteenth field, and also wraps an OPTIONAL struct return in a
 * tuple — so `getUserSummary(): UserSummary?` reintroduces the exact problem that keeping
 * the struct flat was meant to solve. That shipped once and was only caught reading
 * mainnet, because the sandbox types nested tuples correctly and every unit test passed.
 *
 * This asserts the property statically, against the generated wrapper.
 */
const WRAPPER = fs.readFileSync('build/TonCrown/TonCrown_TonCrown.ts', 'utf8');

const loaderBody = (name: string) => {
    const start = WRAPPER.indexOf(`export function loadGetterTuple${name}(`);
    if (start === -1) throw new Error(`loadGetterTuple${name} not found`);
    return WRAPPER.slice(start, WRAPPER.indexOf('\n}', start));
};

const getterBody = (name: string) => {
    const start = WRAPPER.indexOf(`async getGet${name}(`);
    if (start === -1) throw new Error(`getGet${name} not found`);
    return WRAPPER.slice(start, WRAPPER.indexOf('\n    }', start));
};

describe('v2-safe getters stay flat', () => {
    // Getters the frontend reads over TON API v2.
    const FLAT_GETTERS = ['UserSummary', 'ContractConfig'];

    for (const name of FLAT_GETTERS) {
        it(`${name} is not split into a nested tuple`, () => {
            const body = loaderBody(name);
            expect(body).not.toContain('source = source.readTuple()');
            // Tact splits past the 14th field; staying at or under it is what keeps it flat.
            const fields = (body.match(/const _/g) ?? []).length;
            expect(fields).toBeLessThanOrEqual(14);
        });

        it(`${name} is returned non-optional, so nothing wraps it in a tuple`, () => {
            expect(getterBody(name)).not.toContain('readTupleOpt');
        });
    }
});
