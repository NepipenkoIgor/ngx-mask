import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

/**
 * Real-chromium counterparts of the keepCharacterPositions rows in the jsdom characterization
 * (`keep-character-positions-characterization.spec.ts`): a rejected key keeps the display, a
 * selection reaching into the prefix or the suffix keeps both, and a selection deleted up to the
 * end drops the trailing placeholders. The first two rows still pin the browser's own Delete and
 * Backspace behaviour next to separators.
 */

const phone = { mask: '(000) 000-0000', keepCharacterPositions: true, showMaskTyped: true };
const prefixed = {
    mask: '000-000',
    prefix: '+7 ',
    keepCharacterPositions: true,
    showMaskTyped: true,
};
const dollar = {
    mask: '0000.00',
    prefix: '$',
    keepCharacterPositions: true,
    showMaskTyped: true,
};
const bare = { mask: '000-000', keepCharacterPositions: true };
const bareSuffixed = {
    mask: '(000) 000-0000',
    prefix: '+7 ',
    suffix: ' kg',
    keepCharacterPositions: true,
};
const phoneKg = { mask: '(000) 000-0000', suffix: ' kg', keepCharacterPositions: true };
const bareKg = { mask: '000-000', suffix: ' kg', keepCharacterPositions: true };
const suffixed = { mask: '000', suffix: ' kg', keepCharacterPositions: true, showMaskTyped: true };
const plainSuffixed = { mask: '000', suffix: ' kg' };
const plainPrefixed = { mask: '000-000', prefix: '+7 ' };

type Outcome = { value: string; caret: number | null; model: unknown };

/** Writes `initial` through the control (or types it), selects `start`-`end` and presses `keys`. */
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
    await userEvent.keyboard(keys);
    await m.settle();
    return { value: el.value, caret: el.selectionStart, model: m.component.form.value };
}

/** Focuses the empty control without a click, as `el.focus()` leaves the caret, and presses `keys`. */
async function pressOnFocus(config: Record<string, unknown>, keys: string): Promise<Outcome> {
    const m = await mount(MaskHarnessComponent, config);
    await m.settle();
    const el = m.get('#masked');
    el.focus();
    await userEvent.keyboard(keys);
    await m.settle();
    return { value: el.value, caret: el.selectionStart, model: m.component.form.value };
}

describe('keepCharacterPositions oddities in a real browser', () => {
    it('Delete over a selection leaves the caret on its first blank for the next digit', async () => {
        for (const config of [bare, { ...bare, showMaskTyped: true }]) {
            for (const initial of [{ typed: '123456' }, { written: '123456' }]) {
                expect(await press(config, initial, 4, 5, '{Delete}')).toEqual({
                    value: '123-_56',
                    caret: 4,
                    model: '12356',
                });
                expect(await press(config, initial, 4, 5, '{Delete}7')).toEqual({
                    value: '123-756',
                    caret: 5,
                    model: '123756',
                });
            }
        }
    });

    it('a digit typed after a selection delete next to a one-character prefix lands in the freed slot (#1719, #1710)', async () => {
        const config = { ...dollar, mask: '000-000' };
        expect(await press(config, { typed: '123456' }, 1, 2, '{Backspace}')).toEqual({
            value: '$_23-456',
            caret: 1,
            model: '23456',
        });
        expect(await press(config, { typed: '123456' }, 1, 2, '{Backspace}5')).toEqual({
            value: '$523-456',
            caret: 2,
            model: '523456',
        });
    });

    it('a selection delete in a partial showMaskTyped value keeps the mask tail', async () => {
        const maskedBare = { ...bare, showMaskTyped: true };
        for (const initial of [{ typed: '123' }, { written: '123' }]) {
            expect(await press(maskedBare, initial, 2, 3, '{Delete}')).toEqual({
                value: '12_-___',
                caret: 2,
                model: '12',
            });
            expect(await press(maskedBare, initial, 3, 4, '{Backspace}5')).toEqual({
                value: '123-5__',
                caret: 5,
                model: '1235',
            });
        }
    });

    it('a digit typed after a selection delete up to the end appends to the trimmed value', async () => {
        for (const initial of [{ typed: '123456' }, { written: '123456' }]) {
            expect(await press(bare, initial, 3, 7, '{Backspace}9')).toEqual({
                value: '123-9',
                caret: 5,
                model: '1239',
            });
            expect(await press(bare, initial, 1, 7, '{Delete}8')).toEqual({
                value: '18',
                caret: 2,
                model: '18',
            });
        }
    });

    it('Delete at the very end changes nothing: the browser fires no input event', async () => {
        expect(await press(phone, { written: '0123456789' }, 14, 14, '{Delete}')).toEqual({
            value: '(012) 345-6789',
            caret: 14,
            model: '0123456789',
        });
    });

    it('Backspace right after a separator blanks the digit before it', async () => {
        for (const initial of [{ typed: '0123456789' }, { written: '0123456789' }]) {
            expect(await press(phone, initial, 6, 6, '{Backspace}')).toEqual({
                value: '(01_) 345-6789',
                caret: 3,
                model: '013456789',
            });
            expect(await press(phone, initial, 5, 5, '{Backspace}')).toEqual({
                value: '(01_) 345-6789',
                caret: 3,
                model: '013456789',
            });
            expect(await press(phone, initial, 10, 10, '{Backspace}')).toEqual({
                value: '(012) 34_-6789',
                caret: 8,
                model: '012346789',
            });
        }
    });

    it('the digit typed after Backspace past a separator lands in the blanked slot', async () => {
        expect(await press(phone, { written: '0123456789' }, 6, 6, '{Backspace}9')).toEqual({
            value: '(019) 345-6789',
            caret: 4,
            model: '0193456789',
        });
    });

    it('Backspace after a separator blanks the digit before it without showMaskTyped', async () => {
        for (const initial of [{ typed: '123456' }, { written: '123456' }]) {
            expect(await press(bare, initial, 4, 4, '{Backspace}')).toEqual({
                value: '12_-456',
                caret: 2,
                model: '12456',
            });
            expect(await press(bare, initial, 4, 4, '{Backspace}9')).toEqual({
                value: '129-456',
                caret: 3,
                model: '129456',
            });
        }
    });

    it('Backspace after a separator blanks the digit before it behind a prefix', async () => {
        expect(await press(prefixed, { written: '123456' }, 7, 7, '{Backspace}')).toEqual({
            value: '+7 12_-456',
            caret: 5,
            model: '12456',
        });
    });

    it('a selection of only the separators is deleted without touching the digits', async () => {
        expect(await press(phone, { written: '0123456789' }, 4, 6, '{Backspace}')).toEqual({
            value: '(012) 345-6789',
            caret: 4,
            model: '0123456789',
        });
    });

    it('Delete in front of the first digit after a prefix blanks it', async () => {
        for (const initial of [{ typed: '123456' }, { written: '123456' }]) {
            expect(await press(prefixed, initial, 3, 3, '{Delete}')).toEqual({
                value: '+7 _23-456',
                caret: 4,
                model: '23456',
            });
            // the caret advanced to the next slot: the digit typed next overwrites it
            expect(await press(prefixed, initial, 3, 3, '{Delete}9')).toEqual({
                value: '+7 _93-456',
                caret: 5,
                model: '93456',
            });
        }
    });

    it('Delete inside the prefix is still prevented', async () => {
        for (const caret of [0, 1, 2]) {
            expect(await press(prefixed, { written: '123456' }, caret, caret, '{Delete}')).toEqual({
                value: '+7 123-456',
                caret: 3,
                model: '123456',
            });
            expect(
                await press(prefixed, { written: '123456' }, caret, caret, '{Delete}{Delete}')
            ).toEqual({ value: '+7 _23-456', caret: 4, model: '23456' });
        }
    });

    it('Backspace with the caret inside the suffix keeps the model in step with the display', async () => {
        // the leading space of the suffix is not a separator to hop over
        expect(await press(phoneKg, { written: '0123456789' }, 15, 15, '{Backspace}')).toEqual({
            value: '(012) 345-678_ kg',
            caret: 13,
            model: '012345678',
        });
        expect(await press(phoneKg, { written: '0123456789' }, 15, 15, '{Backspace}9')).toEqual({
            value: '(012) 345-6789 kg',
            caret: 14,
            model: '0123456789',
        });
        expect(
            await press(bareSuffixed, { written: '0123456789' }, 18, 18, '{Backspace}9')
        ).toEqual({ value: '+7 (012) 345-6789 kg', caret: 17, model: '0123456789' });
    });

    it('Delete in front of the first digit of a prefixed date is prevented', async () => {
        const date = { mask: 'd0/M0/0000', prefix: '+7 ' };
        for (const config of [date, { ...date, showMaskTyped: true }, { ...date, suffix: ' y' }]) {
            const outcome = await press(config, { written: '15062020' }, 3, 3, '{Delete}');
            expect(outcome.value.startsWith('+7 15/06/2020')).toBe(true);
            expect(outcome.model).toBe('15062020');
        }
    });

    it('Delete in front of the first digit of a plain prefix mask removes it', async () => {
        for (const initial of [{ typed: '123456' }, { written: '123456' }]) {
            expect(await press(plainPrefixed, initial, 3, 3, '{Delete}')).toEqual({
                value: '+7 234-56',
                caret: 3,
                model: '23456',
            });
            // the caret stayed in front of the first digit: the next Delete removes that one too
            expect(await press(plainPrefixed, initial, 3, 3, '{Delete}{Delete}')).toEqual({
                value: '+7 345-6',
                caret: 3,
                model: '3456',
            });
        }
    });

    it('Delete inside the prefix of a plain prefix mask is still prevented', async () => {
        for (const caret of [0, 1, 2]) {
            expect(
                await press(plainPrefixed, { written: '123456' }, caret, caret, '{Delete}')
            ).toEqual({ value: '+7 123-456', caret: 3, model: '123456' });
        }
    });

    it('Delete stays prevented where the first-slot guard does not apply', async () => {
        const decimal = {
            mask: '0000.00',
            prefix: '$',
            keepCharacterPositions: true,
            showMaskTyped: true,
        };
        const leadingSeparator = {
            mask: '(000) 000 00 00',
            prefix: '+7 ',
            keepCharacterPositions: true,
            showMaskTyped: true,
        };
        const negative = { mask: 'separator.2', prefix: '$', allowNegativeNumbers: true };
        const cases: [Record<string, unknown>, string, number, Outcome][] = [
            [decimal, '123456', 1, { value: '$1234.56', caret: 1, model: '123456' }],
            [
                leadingSeparator,
                '1234567890',
                3,
                { value: '+7 (123) 456 78 90', caret: 3, model: '1234567890' },
            ],
            [
                { mask: '(000) 000 00 00', prefix: '+7 ' },
                '1234567890',
                3,
                { value: '+7 (123) 456 78 90', caret: 3, model: '1234567890' },
            ],
            [{ mask: '0000', prefix: '$' }, '1234', 1, { value: '$1234', caret: 1, model: '1234' }],
            [
                { mask: 'separator.2', prefix: '+7 ' },
                '1234.56',
                3,
                { value: '+7 1,234.56', caret: 3, model: 1234.56 },
            ],
            [
                { mask: 'separator.2', prefix: '$' },
                '1234.56',
                1,
                { value: '$1,234.56', caret: 1, model: 1234.56 },
            ],
            [negative, '-1234.56', 1, { value: '-$1,234.56', caret: 1, model: -1234.56 }],
        ];
        for (const [config, written, caret, expected] of cases) {
            expect(await press(config, { written }, caret, caret, '{Delete}')).toEqual(expected);
        }
    });

    it('Delete in front of the digits of a hiddenInput mask deletes the digit, there is no suffix', async () => {
        const hidden = { mask: '000-000', suffix: ' kg', hiddenInput: true, showMaskTyped: true };
        expect(await press(hidden, { typed: '1234' }, 4, 4, '{Delete}')).toEqual({
            value: '123-___',
            caret: 3,
            model: '123',
        });
    });

    it('a number mask with a suffix keeps its own Delete handling', async () => {
        const money = { mask: 'separator.2', prefix: '$', suffix: ' USD', showMaskTyped: true };
        expect(await press(money, { written: '1234.56' }, 12, 12, '{Delete}')).toEqual({
            value: '$1,234.56_._ USD',
            caret: 9,
            model: 1234.56,
        });
    });

    it('Delete at the end of the digits is prevented and leaves the suffix and the caret alone', async () => {
        for (const config of [suffixed, plainSuffixed]) {
            for (const initial of [{ typed: '123' }, { written: '123' }]) {
                expect(await press(config, initial, 3, 3, '{Delete}')).toEqual({
                    value: '123 kg',
                    caret: 3,
                    model: '123',
                });
                // the caret really stayed in front of the suffix: Backspace removes the last digit
                expect((await press(config, initial, 3, 3, '{Delete}{Backspace}')).caret).toBe(2);
                expect((await press(config, initial, 3, 3, '{Delete}{Backspace}')).model).toBe(
                    '12'
                );
            }
        }
    });

    it('Delete over only the suffix is prevented too', async () => {
        for (const initial of [{ typed: '123' }, { written: '123' }]) {
            expect(await press(suffixed, initial, 3, 6, '{Delete}')).toEqual({
                value: '123 kg',
                caret: 3,
                model: '123',
            });
        }
    });

    it('a rejected key keeps the suffix when the value was written programmatically', async () => {
        expect(await press(suffixed, { written: '123' }, 3, 3, '9')).toEqual({
            value: '123 kg',
            caret: 3,
            model: '123',
        });
    });

    it('a rejected key keeps the suffix when the user typed the value', async () => {
        expect(await press(suffixed, { typed: '123' }, 3, 3, '9')).toEqual({
            value: '123 kg',
            caret: 3,
            model: '123',
        });
    });

    it('a rejected letter keeps the suffix when the value was written programmatically', async () => {
        expect(await press(suffixed, { written: '123' }, 1, 1, 'a')).toEqual({
            value: '123 kg',
            caret: 1,
            model: '123',
        });
    });

    it('a rejected letter over a selection keeps the display and the caret at its start', async () => {
        expect(await press(phone, { written: '0123456789' }, 1, 3, 'a')).toEqual({
            value: '(012) 345-6789',
            caret: 1,
            model: '0123456789',
        });
    });

    it('a rejected letter over a selection that starts inside the prefix keeps the display', async () => {
        expect(await press(prefixed, { written: '123456' }, 1, 5, 'a')).toEqual({
            value: '+7 123-456',
            caret: 3,
            model: '123456',
        });
    });

    it('a digit over a selection that starts inside the prefix keeps the prefix', async () => {
        expect(await press(prefixed, { written: '123456' }, 1, 5, '9')).toEqual({
            value: '+7 9_3-456',
            caret: 4,
            model: '93456',
        });
    });

    it('a digit over a selection spanning the end of the prefix keeps it out of the model', async () => {
        expect(await press(prefixed, { written: '123456' }, 2, 4, '9')).toEqual({
            value: '+7 923-456',
            caret: 4,
            model: '923456',
        });
    });

    it('the pressed digit is typed when a selection starts on a one-character prefix', async () => {
        expect(await press(dollar, { written: '123456' }, 0, 3, '9')).toEqual({
            value: '$9_34.56',
            caret: 2,
            model: '93456',
        });
    });

    it('a digit over a selection reaching into the suffix keeps the suffix', async () => {
        expect(await press(suffixed, { written: '123' }, 1, 5, '9')).toEqual({
            value: '19_ kg',
            caret: 2,
            model: '19',
        });
    });

    it('a digit over a selection reaching into the suffix keeps it without showMaskTyped', async () => {
        expect(await press(bareSuffixed, { written: '0123' }, 0, 11, '9')).toEqual({
            value: '+7 (9__) _ kg',
            caret: 5,
            model: '9',
        });
    });

    it('a digit over a selection from the middle of the number into the suffix keeps it', async () => {
        expect(await press(phoneKg, { written: '123' }, 2, 6, '5')).toEqual({
            value: '(15_ kg',
            caret: 3,
            model: '15',
        });
    });

    it('a digit over a selection from the second digit into the suffix keeps it', async () => {
        expect(await press(bareKg, { written: '12' }, 1, 5, '7')).toEqual({
            value: '17 kg',
            caret: 2,
            model: '17',
        });
    });

    it('deleting a selection up to the end of the number keeps the suffix once and trims', async () => {
        expect(await press(bareKg, { written: '123' }, 1, 3, '{Backspace}')).toEqual({
            value: '1 kg',
            caret: 1,
            model: '1',
        });
        expect(await press(bareKg, { written: '123456' }, 4, 7, '{Backspace}')).toEqual({
            value: '123 kg',
            caret: 3,
            model: '123',
        });
    });

    it('Delete over a selection up to the end of the number keeps the caret in front of the suffix', async () => {
        const prefixedKg = { ...bareKg, prefix: '+7 ' };
        expect(await press(prefixedKg, { written: '123456' }, 4, 10, '{Delete}')).toEqual({
            value: '+7 1 kg',
            caret: 4,
            model: '1',
        });
        expect(await press(prefixedKg, { written: '123456' }, 4, 10, '{Delete}5')).toEqual({
            value: '+7 15 kg',
            caret: 5,
            model: '15',
        });
    });

    it('a digit over a selection that ends inside the prefix lands in the first slot', async () => {
        expect(await press(prefixed, { written: '123456' }, 0, 2, '9')).toEqual({
            value: '+7 923-456',
            caret: 4,
            model: '923456',
        });
    });

    it('a digit over only the suffix is rejected and the display kept', async () => {
        expect(await press(suffixed, { written: '123' }, 3, 6, '9')).toEqual({
            value: '123 kg',
            caret: 3,
            model: '123',
        });
    });

    it('deleting a selection up to the end drops the trailing placeholders and separators', async () => {
        expect(await press(bare, { written: '123456' }, 4, 7, '{Backspace}')).toEqual({
            value: '123',
            caret: 3,
            model: '123',
        });
    });

    it('deleting a selection up to the end keeps the gaps in front of the last digit', async () => {
        const m = await mount(MaskHarnessComponent, bare);
        m.component.form.setValue('123456');
        await m.settle();
        const el = m.get('#masked');
        el.focus();
        el.setSelectionRange(2, 2);
        await userEvent.keyboard('{Backspace}');
        await m.settle();
        el.setSelectionRange(3, 7);
        await userEvent.keyboard('{Backspace}');
        await m.settle();
        expect({
            value: el.value,
            caret: el.selectionStart,
            model: m.component.form.value,
        }).toEqual({
            value: '1_3',
            caret: 3,
            model: '13',
        });
    });

    it('typing into the focused empty phone skeleton fills the first slots', async () => {
        expect(await pressOnFocus(phone, '98')).toEqual({
            value: '(98_) ___-____',
            caret: 3,
            model: '98',
        });
    });

    it('typing after the End key on the empty phone skeleton fills the first slots', async () => {
        expect(await pressOnFocus(phone, '{End}98')).toEqual({
            value: '(98_) ___-____',
            caret: 3,
            model: '98',
        });
    });

    it('typing into the focused empty skeleton fills the first slots after the prefix', async () => {
        expect(await pressOnFocus(prefixed, '98')).toEqual({
            value: '+7 98_-___',
            caret: 5,
            model: '98',
        });
    });
});
