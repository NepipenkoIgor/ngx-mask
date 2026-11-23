import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

/**
 * keepCharacterPositions next to a prefix and a suffix in real chromium: Delete keeps the slot
 * it targets (#1716), a Delete or a rejected key never drops the suffix, moves the caret into it
 * or emits an unchanged model (#1717, #1718, #1711), a retyped digit reaches the model (#1722)
 * and a prefix equal to the suffix survives typing (#1712).
 */

const dollarPhone = {
    mask: '(000) 000-0000',
    prefix: '$',
    suffix: '$',
    keepCharacterPositions: true,
    showMaskTyped: true,
};
const phoneKg = {
    mask: '(000) 000-0000',
    prefix: '+7 ',
    suffix: ' kg',
    keepCharacterPositions: true,
    showMaskTyped: true,
};

type Outcome = { value: string; caret: number | null; model: unknown; emits: number };

/** Writes (or types) `initial`, selects `start`-`end`, presses `keys`, reports what the user sees. */
async function press(
    config: Record<string, unknown>,
    initial: { written: string } | { typed: string },
    start: number,
    end: number,
    keys: string
): Promise<Outcome> {
    const m = await mount(MaskHarnessComponent, config);
    if ('written' in initial) {
        m.component.form.setValue(initial.written);
        await m.settle();
    } else {
        await m.type('#masked', initial.typed);
    }
    const el = m.get('#masked');
    el.focus();
    el.setSelectionRange(start, end);
    const before = m.component.counter();
    await userEvent.keyboard(keys);
    await m.settle();
    return {
        value: el.value,
        caret: el.selectionStart,
        model: m.component.form.value,
        emits: m.component.counter() - before,
    };
}

describe('keepCharacterPositions with a prefix or a suffix in a real browser', () => {
    it('Delete before a digit blanks that digit and no other slot when a prefix leads (#1716)', async () => {
        for (const showMaskTyped of [true, false]) {
            const prefixed = {
                mask: '000-000',
                prefix: '+7 ',
                keepCharacterPositions: true,
                showMaskTyped,
            };
            const out = await press(prefixed, { written: '123456' }, 4, 4, '{Delete}');
            expect(out.value.replace(/_+$/, '')).toBe('+7 1_3-456');
            expect(out.model).toBe('13456');
        }
        const phone = { mask: '(000) 000-0000', prefix: '$', keepCharacterPositions: true };
        expect((await press(phone, { written: '0123456789' }, 2, 2, '{Delete}')).value).toBe(
            '$(_12) 345-6789'
        );
        const money = { mask: '0000.00', prefix: '$', keepCharacterPositions: true };
        expect((await press(money, { written: '123456' }, 2, 2, '{Delete}')).value).toBe(
            '$1_34.56'
        );
    });

    it('Delete before a separator keeps the suffix and emits nothing (#1717)', async () => {
        expect(await press(phoneKg, { written: '0123456789' }, 8, 8, '{Delete}')).toEqual({
            value: '+7 (012) 345-6789 kg',
            caret: 9,
            model: '0123456789',
            emits: 0,
        });
    });

    it('a rejected key at the end of a full value keeps the caret out of the suffix (#1718)', async () => {
        for (const showMaskTyped of [true, false]) {
            const config = {
                mask: '0000',
                suffix: ' $',
                keepCharacterPositions: true,
                showMaskTyped,
            };
            expect(await press(config, { written: '1234' }, 4, 4, '7')).toEqual({
                value: '1234 $',
                caret: 4,
                model: '1234',
                emits: 0,
            });
        }
    });

    it('a digit retyped after a Backspace over the last digit and the suffix space reaches the model (#1722)', async () => {
        const config = { mask: '(000) 000-0000', suffix: ' kg', keepCharacterPositions: true };
        const out = await press(config, { written: '0123456789' }, 13, 15, '{Backspace}9');
        expect(out.value).toBe('(012) 345-6789 kg');
        expect(out.model).toBe('0123456789');
    });

    it('a prefix equal to the suffix survives typing a full value (#1712)', async () => {
        const m = await mount(MaskHarnessComponent, dollarPhone);
        await m.type('#masked', '0123456789');
        expect(m.get('#masked').value).toBe('$(012) 345-6789$');
        expect(m.component.form.value).toBe('0123456789');
    });

    it('Delete over a selection inside the suffix leaves it and the model intact (#1711)', async () => {
        const config = {
            mask: '000-000',
            suffix: ' kg',
            keepCharacterPositions: true,
            showMaskTyped: true,
        };
        for (const [start, end] of [
            [8, 9],
            [7, 9],
            [9, 10],
        ] as [number, number][]) {
            const out = await press(config, { written: '123' }, start, end, '{Delete}');
            expect(out.value).toBe('123-___ kg');
            expect(out.model).toBe('123');
        }
    });

    it('masks a run inserted before the prefix of an empty field as a paste', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: '0000.00',
            prefix: '$',
            keepCharacterPositions: true,
            showMaskTyped: true,
        });
        const field = m.get('#masked');
        field.focus();
        field.setSelectionRange(0, 0);
        document.execCommand('insertText', false, '123456');
        await m.settle();
        expect(field.value).toBe('$1234.56');
        expect(field.selectionStart).toBe(8);
    });
});
