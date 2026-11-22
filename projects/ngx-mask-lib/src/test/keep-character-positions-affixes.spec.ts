import { describe, expect, it } from 'vitest';

import { createHarness } from './utils/characterization-harness';
import type { EditAction } from './utils/characterization-harness';
import type { TestMaskComponent } from './utils/test-component.component';

/** keepCharacterPositions next to a prefix and a suffix (#1716, #1717, #1718, #1722, #1712, #1711). */

type Config = Partial<{
    [
        K in keyof TestMaskComponent as TestMaskComponent[K] extends { set: unknown } ? K : never
    ]: TestMaskComponent[K] extends { set: (v: infer V) => void } ? V : never;
}>;

async function edit(config: Config, written: string, action: EditAction, then?: string) {
    const harness = createHarness();
    for (const [key, value] of Object.entries(config)) {
        (harness.component as unknown as Record<string, { set: (v: unknown) => void }>)[key]?.set(
            value
        );
    }
    harness.fixture.detectChanges();
    await harness.settle();
    await harness.write(written);
    const snap = await harness.edit(action);
    return then ? harness.type(then) : snap;
}

const kcp = { keepCharacterPositions: true } as const;
const del = (at: number): EditAction => ({ start: at, end: at, key: 'Delete' });

type Case = {
    name: string;
    config: Config;
    written: string;
    action: EditAction;
    then?: string;
    expected: { value: string; model?: unknown; caret?: number };
};

const prefixed = { ...kcp, mask: '000-000', prefix: '+7 ' };
const phoneKg = {
    ...kcp,
    mask: '(000) 000-0000',
    prefix: '+7 ',
    suffix: ' kg',
    showMaskTyped: true,
};
const insideSuffix = { ...kcp, mask: '000-000', suffix: ' kg', showMaskTyped: true };

const cases: Case[] = [
    {
        name: 'Delete before a digit blanks that digit behind a prefix (#1716)',
        config: prefixed,
        written: '123456',
        action: del(4),
        expected: { value: '+7 1_3-456' },
    },
    {
        name: 'Delete before a digit blanks that digit behind a prefix with showMaskTyped (#1716)',
        config: { ...prefixed, showMaskTyped: true },
        written: '123456',
        action: del(4),
        expected: { value: '+7 1_3-456' },
    },
    {
        name: 'Delete at caret 2 behind a one-character prefix and a bracket (#1716)',
        config: { ...kcp, mask: '(000) 000-0000', prefix: '$' },
        written: '0123456789',
        action: del(2),
        expected: { value: '$(_12) 345-6789' },
    },
    {
        name: 'Delete at caret 2 behind a one-character prefix (#1716)',
        config: { ...kcp, mask: '0000.00', prefix: '$' },
        written: '123456',
        action: del(2),
        expected: { value: '$1_34.56' },
    },
    {
        name: 'Delete before a separator keeps the suffix and the model (#1717)',
        config: phoneKg,
        written: '0123456789',
        action: del(8),
        expected: { value: '+7 (012) 345-6789 kg', model: '0123456789' },
    },
    {
        name: 'a rejected key at the end of a full value keeps the caret out of the suffix (#1718)',
        config: { ...kcp, mask: '0000', suffix: ' $' },
        written: '1234',
        action: { start: 4, end: 4, key: '7' },
        expected: { value: '1234 $', caret: 4, model: '1234' },
    },
    {
        name: 'a rejected key at the end of a full value keeps the caret out of the suffix with showMaskTyped (#1718)',
        config: { ...kcp, mask: '0000', suffix: ' $', showMaskTyped: true },
        written: '1234',
        action: { start: 4, end: 4, key: '7' },
        expected: { value: '1234 $', caret: 4, model: '1234' },
    },
    {
        name: 'a digit retyped after Backspace over the last digit and the suffix space reaches the model (#1722)',
        config: { ...kcp, mask: '(000) 000-0000', suffix: ' kg' },
        written: '0123456789',
        action: { start: 13, end: 15, key: 'Backspace' },
        then: '9',
        expected: { value: '(012) 345-6789 kg', model: '0123456789' },
    },
    {
        name: 'Delete over a selection inside the suffix keeps it and the model (#1711, 8-9)',
        config: insideSuffix,
        written: '123',
        action: { start: 8, end: 9, key: 'Delete' },
        expected: { value: '123-___ kg', model: '123' },
    },
    {
        name: 'Delete over a selection reaching into the suffix keeps it and the model (#1711, 7-9)',
        config: insideSuffix,
        written: '123',
        action: { start: 7, end: 9, key: 'Delete' },
        expected: { value: '123-___ kg', model: '123' },
    },
];

describe('keepCharacterPositions with a prefix or a suffix', () => {
    for (const c of cases) {
        it(c.name, async () => {
            const out = await edit(c.config, c.written, c.action, c.then);
            expect(out).toMatchObject(c.expected);
        });
    }

    it('a prefix equal to the suffix survives typing a full value (#1712)', async () => {
        const harness = createHarness();
        const config = {
            ...kcp,
            mask: '(000) 000-0000',
            prefix: '$',
            suffix: '$',
            showMaskTyped: true,
        };
        for (const [key, value] of Object.entries(config)) {
            (harness.component as unknown as Record<string, { set: (v: unknown) => void }>)[
                key
            ]?.set(value);
        }
        harness.fixture.detectChanges();
        await harness.settle();
        harness.el.setSelectionRange(1, 1);
        const out = await harness.type('0123456789');
        expect(out.value).toBe('$(012) 345-6789$');
        expect(out.model).toBe('0123456789');
    });
});
