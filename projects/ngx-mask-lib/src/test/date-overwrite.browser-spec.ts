import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import type { Mounted } from './utils/browser-harness';
import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

/**
 * Real-chromium cases for typing into a complete date: a digit overwrites the next digit slot (a
 * separator is skipped), so the digits that follow never shift. With leadZeroDateTime a field the
 * digit would push out of range is repaired (`3` over `15` is `30`, `4` over `15` is `04`). The
 * caret is placed with `setSelectionRange`, every key goes through `userEvent.keyboard`.
 */

type Config = Record<string, unknown>;
type Outcome = { value: string; caret: number | null; model: unknown };

const outcome = (m: Mounted<MaskHarnessComponent>): Outcome => {
    const el = m.get('#masked');
    return { value: el.value, caret: el.selectionStart, model: m.component.form.value };
};

/** Writes `initial`, selects `from`-`to` (a caret when equal) and types `keys` key by key. */
async function typedAt(
    config: Config,
    initial: string,
    from: number,
    keys: string,
    to = from
): Promise<Outcome> {
    const m = await mount(MaskHarnessComponent, config);
    m.component.form.setValue(initial);
    await m.settle();
    m.select('#masked', from, to);
    await userEvent.keyboard(keys);
    await m.settle();
    return outcome(m);
}

/** Splices `data` over the selection and fires `input` with no keydown before it (insertText). */
const insert = (el: HTMLInputElement, data: string): void => {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.value = el.value.slice(0, start) + data + el.value.slice(end);
    el.setSelectionRange(start + data.length, start + data.length);
    el.dispatchEvent(
        new InputEvent('input', {
            bubbles: true,
            inputType: 'insertText',
            data,
            isComposing: false,
        })
    );
};

describe('typing into a complete date in a real browser', () => {
    const date = { mask: 'd0/M0/0000', leadZeroDateTime: true };

    it('places the caret after the overwritten digit, a tens slot or a field end', async () => {
        expect(await typedAt(date, '15062020', 3, '1')).toEqual({
            value: '15/10/2020',
            caret: 4,
            model: '15102020',
        });
        expect(await typedAt(date, '15062020', 0, '3')).toMatchObject({ caret: 1 });
        expect(await typedAt(date, '15062020', 3, '3')).toEqual({
            value: '15/03/2020',
            caret: 5,
            model: '15032020',
        });
        expect(await typedAt(date, '15062020', 4, '9')).toEqual({
            value: '15/09/2020',
            caret: 5,
            model: '15092020',
        });
    });

    it('keeps the caret in place for a key the slot rejects', async () => {
        expect(await typedAt(date, '15062020', 1, 'a')).toEqual({
            value: '15/06/2020',
            caret: 1,
            model: '15062020',
        });
        expect(await typedAt(date, '15062020', 4, '/')).toEqual({
            value: '15/06/2020',
            caret: 4,
            model: '15062020',
        });
    });

    it('overwrites the same way when the edit arrives without a keydown', async () => {
        const m = await mount(MaskHarnessComponent, date);
        m.component.form.setValue('15062020');
        await m.settle();
        m.select('#masked', 1, 1);
        insert(m.get('#masked'), '9');
        await m.settle();
        expect(outcome(m)).toEqual({ value: '19/06/2020', caret: 2, model: '19062020' });
    });

    it('overwrites after a bulk insertText of the whole date, without a keydown', async () => {
        const m = await mount(MaskHarnessComponent, date);
        const el = m.get('#masked');
        el.focus();
        insert(el, '15062020');
        await m.settle();
        expect(el.value).toBe('15/06/2020');
        el.setSelectionRange(1, 1);
        insert(el, '9');
        await m.settle();
        expect(outcome(m)).toEqual({ value: '19/06/2020', caret: 2, model: '19062020' });
    });

    it('overwrites the digit at the caret and never shifts the year', async () => {
        expect(await typedAt(date, '15062020', 1, '9')).toMatchObject({
            value: '19/06/2020',
            model: '19062020',
        });
        expect(await typedAt(date, '15062020', 4, '9')).toMatchObject({
            value: '15/09/2020',
            model: '15092020',
        });
        expect(await typedAt(date, '15062020', 5, '7')).toMatchObject({
            value: '15/06/7020',
            model: '15067020',
        });
        expect(await typedAt(date, '15062020', 6, '1')).toMatchObject({
            value: '15/06/1020',
            model: '15061020',
        });
    });

    it('skips the separator when the caret stands in front of it', async () => {
        expect(await typedAt(date, '15062020', 2, '1')).toMatchObject({
            value: '15/10/2020',
            model: '15102020',
        });
        expect(await typedAt(date, '15062020', 5, '1')).toMatchObject({
            value: '15/06/1020',
            model: '15061020',
        });
    });

    it('zero-fills a tens digit that would push the day or month out of range', async () => {
        expect(await typedAt(date, '15062020', 0, '3')).toEqual({
            value: '30/06/2020',
            caret: 1,
            model: '30062020',
        });
        expect(await typedAt(date, '15062020', 0, '31')).toMatchObject({
            value: '31/06/2020',
            model: '31062020',
        });
        expect(await typedAt(date, '15062020', 3, '1')).toMatchObject({
            value: '15/10/2020',
            model: '15102020',
        });
    });

    it('makes a digit that cannot be a tens digit the whole field', async () => {
        expect(await typedAt(date, '15062020', 0, '4')).toEqual({
            value: '04/06/2020',
            caret: 2,
            model: '04062020',
        });
        expect(await typedAt(date, '15062020', 3, '3')).toMatchObject({
            value: '15/03/2020',
            model: '15032020',
        });
    });

    it('zero-fills a digit typed over a whole selected field the same way', async () => {
        expect(await typedAt(date, '15062020', 0, '3', 2)).toEqual({
            value: '30/06/2020',
            caret: 1,
            model: '30062020',
        });
        expect(await typedAt(date, '15062020', 0, '31', 2)).toMatchObject({
            value: '31/06/2020',
            model: '31062020',
        });
        expect(await typedAt(date, '15062020', 3, '1', 5)).toEqual({
            value: '15/10/2020',
            caret: 4,
            model: '15102020',
        });
        expect(await typedAt(date, '15062020', 3, '4', 5)).toEqual({
            value: '15/04/2020',
            caret: 5,
            model: '15042020',
        });
    });

    it('turns a typed 00 into 01 and keeps the other fields', async () => {
        expect(await typedAt(date, '15062020', 3, '0', 5)).toMatchObject({
            value: '15/01/2020',
            model: '15012020',
        });
        expect(await typedAt(date, '31122020', 2, '0')).toMatchObject({
            value: '31/02/2020',
            model: '31022020',
        });
    });

    it('rejects a key the slot does not accept', async () => {
        expect(await typedAt(date, '15062020', 1, 'a')).toMatchObject({
            value: '15/06/2020',
            model: '15062020',
        });
        expect(await typedAt(date, '15062020', 4, '/')).toMatchObject({
            value: '15/06/2020',
            model: '15062020',
        });
    });

    it('types a whole new date over an existing one without a shift', async () => {
        expect(await typedAt(date, '15062020', 0, '2512')).toMatchObject({
            value: '25/12/2020',
            model: '25122020',
        });
    });

    it('overwrites in a year-first mask and pads a month above 12', async () => {
        const yearFirst = { mask: '0000.M0.d0', leadZeroDateTime: true };
        expect(await typedAt(yearFirst, '20201231', 6, '3')).toMatchObject({
            value: '2020.03.31',
            model: '20200331',
        });
        expect(await typedAt(yearFirst, '20201231', 6, '4')).toMatchObject({
            value: '2020.04.31',
            model: '20200431',
        });
        expect(await typedAt(yearFirst, '20201231', 8, '2')).toMatchObject({
            value: '2020.12.21',
            model: '20201221',
        });
    });

    it('overwrites in a month-day mask', async () => {
        const monthDay = { mask: 'M0/d0', leadZeroDateTime: true };
        expect(await typedAt(monthDay, '1231', 0, '2')).toMatchObject({
            value: '02/31',
            model: '0231',
        });
        expect(await typedAt(monthDay, '1231', 3, '2')).toMatchObject({
            value: '12/21',
            model: '1221',
        });
    });
});

describe('typing into a complete date with showMaskTyped in a real browser', () => {
    const typedDate = { mask: 'd0/M0/0000', leadZeroDateTime: true, showMaskTyped: true };

    it('overwrites a digit of a partial date and keeps the placeholders', async () => {
        expect(await typedAt(typedDate, '1506', 3, '9')).toMatchObject({
            value: '15/09/____',
            model: '1509',
        });
    });

    it('overwrites in a full date', async () => {
        expect(await typedAt(typedDate, '15062020', 0, '4')).toMatchObject({
            value: '04/06/2020',
            model: '04062020',
        });
        expect(await typedAt(typedDate, '15062020', 3, '1', 5)).toMatchObject({
            value: '15/10/2020',
            model: '15102020',
        });
    });
});

describe('typing into a complete date and time in a real browser', () => {
    const composite = { mask: 'd0/M0/0000 Hh:m0:s0', leadZeroDateTime: true };
    const value = '15062020123045';

    it('overwrites the hour, minute and second and never loses the seconds', async () => {
        expect(await typedAt(composite, value, 11, '9')).toMatchObject({
            value: '15/06/2020 09:30:45',
            model: '15062020093045',
        });
        expect(await typedAt(composite, value, 14, '7')).toMatchObject({
            value: '15/06/2020 12:07:45',
            model: '15062020120745',
        });
        expect(await typedAt(composite, value, 17, '9')).toMatchObject({
            value: '15/06/2020 12:30:09',
            model: '15062020123009',
        });
        expect(await typedAt(composite, value, 18, '7')).toMatchObject({
            value: '15/06/2020 12:30:47',
            model: '15062020123047',
        });
    });

    it('overwrites the date half the same way', async () => {
        expect(await typedAt(composite, value, 0, '4')).toMatchObject({
            value: '04/06/2020 12:30:45',
            model: '04062020123045',
        });
    });

    it('limits the hour to 12 with apm', async () => {
        expect(await typedAt({ ...composite, apm: true }, value, 11, '2')).toMatchObject({
            value: '15/06/2020 02:30:45',
            model: '15062020023045',
        });
    });

    it('overwrites the date half with showMaskTyped', async () => {
        expect(await typedAt({ ...composite, showMaskTyped: true }, value, 3, '9')).toMatchObject({
            value: '15/09/2020 12:30:45',
            model: '15092020123045',
        });
    });
});

describe('masks the overwrite leaves alone, in a real browser', () => {
    it('keeps a time-only mask on regular masking', async () => {
        expect(
            await typedAt({ mask: 'Hh:m0:s0', leadZeroDateTime: true }, '123045', 0, '9')
        ).toMatchObject({ value: '09:12:30' });
    });

    it('keeps keepCharacterPositions on its own slot rules', async () => {
        const kcp = {
            mask: 'd0/M0/0000',
            leadZeroDateTime: true,
            keepCharacterPositions: true,
            showMaskTyped: true,
        };
        // 35 is no day: the slot rejects the digit (#1724) instead of repairing the field
        expect(await typedAt(kcp, '15062020', 0, '3')).toMatchObject({
            value: '15/06/2020',
            model: '15062020',
        });
    });

    it('keeps a prefix mask on the parent overwrite, which drops one character and shifts', async () => {
        const prefixed = { mask: 'd0/M0/0000', leadZeroDateTime: true, prefix: '+ ' };
        expect(await typedAt(prefixed, '15062020', 5, '3')).toMatchObject({
            value: '+ 15/03/6202',
            model: '15036202',
        });
    });
});
