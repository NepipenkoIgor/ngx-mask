import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import type { Mounted } from './utils/browser-harness';
import { copyToClipboard, mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

/**
 * Real-chromium cases for the date / time padding fixes: an out-of-range month or hour is padded
 * with a leading zero, and a typed, pasted or Backspaced `00` day, month or 12-hour hour becomes
 * `01` (leadZeroDateTime only; programmatic writes keep their value). Every key goes through
 * `userEvent.keyboard`, so the caret and `input` events are the ones a user gets.
 */

type Config = Record<string, unknown>;
type Outcome = { value: string; caret: number | null; model: unknown };

const outcome = (m: Mounted<MaskHarnessComponent>): Outcome => {
    const el = m.get('#masked');
    return { value: el.value, caret: el.selectionStart, model: m.component.form.value };
};

/** Types `keys` key by key into an empty input. */
async function typed(config: Config, keys: string): Promise<Outcome> {
    const m = await mount(MaskHarnessComponent, config);
    await m.type('#masked', keys);
    return outcome(m);
}

/** Types `initial`, puts the caret at `caret` and presses Backspace. */
async function backspaceAt(config: Config, initial: string, caret: number): Promise<Outcome> {
    const m = await mount(MaskHarnessComponent, config);
    await m.type('#masked', initial);
    m.select('#masked', caret, caret);
    await userEvent.keyboard('{Backspace}');
    await m.settle();
    return outcome(m);
}

/** Writes `value` through the form control, as a programmatic model write. */
async function written(config: Config, value: string): Promise<Outcome> {
    const m = await mount(MaskHarnessComponent, config);
    m.component.form.setValue(value);
    await m.settle();
    return outcome(m);
}

/** Pastes `text` through the browser clipboard into an empty input. */
async function pasted(config: Config, text: string): Promise<Outcome> {
    const m = await mount(MaskHarnessComponent, config);
    await copyToClipboard(text);
    m.focus('#masked');
    await userEvent.paste();
    await m.settle();
    return outcome(m);
}

/** Writes `value` through the form control, puts the caret at `caret` and presses Backspace. */
async function writtenThenBackspace(
    config: Config,
    value: string,
    caret: number
): Promise<Outcome> {
    const m = await mount(MaskHarnessComponent, config);
    m.component.form.setValue(value);
    await m.settle();
    m.select('#masked', caret, caret);
    await userEvent.keyboard('{Backspace}');
    await m.settle();
    return outcome(m);
}

describe('month and hour overflow in a real browser', () => {
    const yearFirst = { mask: '0000.M0.d0', leadZeroDateTime: true };
    const time = { mask: 'Hh:m0:s0', leadZeroDateTime: true };
    const twelveHour = { mask: 'Hh:m0:s0', apm: true, leadZeroDateTime: true };

    it('pads a month above 12 in a year-first mask', async () => {
        expect(await typed(yearFirst, '202013')).toEqual({
            value: '2020.01.3',
            caret: 9,
            model: '2020013',
        });
        expect(await typed({ mask: '0000-M0-d0', leadZeroDateTime: true }, '202014')).toEqual({
            value: '2020-01-04',
            caret: 10,
            model: '20200104',
        });
        expect(await typed({ mask: '0000M0d0', leadZeroDateTime: true }, '202013')).toEqual({
            value: '2020013',
            caret: 7,
            model: '2020013',
        });
    });

    it('keeps a valid month in a year-first mask', async () => {
        expect(await typed(yearFirst, '20201215')).toEqual({
            value: '2020.12.15',
            caret: 10,
            model: '20201215',
        });
    });

    it('pads an hour above 23 and starts the minutes with the next digit', async () => {
        expect(await typed(time, '24')).toEqual({ value: '02:4', caret: 4, model: '024' });
        expect(await typed(time, '29')).toEqual({ value: '02:09', caret: 5, model: '0209' });
        expect(await typed(time, '246060')).toEqual({
            value: '02:46:06',
            caret: 8,
            model: '024606',
        });
        expect(await typed(time, '2359')).toEqual({ value: '23:59', caret: 5, model: '2359' });
    });

    it('leaves hour 24 alone without leadZeroDateTime', async () => {
        expect(await typed({ mask: 'Hh:m0:s0' }, '24')).toEqual({
            value: '2:4',
            caret: 3,
            model: '24',
        });
    });

    it('pads a first hour digit of 3 to 9 with apm and keeps the digit', async () => {
        const hourMinutes = { mask: 'Hh:m0', apm: true, leadZeroDateTime: true };
        expect(await typed(hourMinutes, '930')).toEqual({
            value: '09:30',
            caret: 5,
            model: '0930',
        });
        expect(await typed(hourMinutes, '815')).toEqual({
            value: '08:15',
            caret: 5,
            model: '0815',
        });
        expect(await typed(hourMinutes, '45')).toEqual({ value: '04:5', caret: 4, model: '045' });
        expect(await typed(twelveHour, '930')).toEqual({
            value: '09:30',
            caret: 5,
            model: '0930',
        });
    });

    it('pads an hour above 12 with apm', async () => {
        expect(await typed(twelveHour, '13')).toEqual({ value: '01:3', caret: 4, model: '013' });
        expect(await typed(twelveHour, '19')).toEqual({ value: '01:09', caret: 5, model: '0109' });
        expect(await typed(twelveHour, '1259')).toEqual({
            value: '12:59',
            caret: 5,
            model: '1259',
        });
    });
});

describe('00 day, month and hour in a real browser', () => {
    const date = { mask: 'd0/M0/0000', leadZeroDateTime: true };
    const twelveHour = { mask: 'Hh:m0:s0', apm: true, leadZeroDateTime: true };

    it('turns a typed 00 day into 01 and a typed 00 month into 01', async () => {
        expect(await typed(date, '00')).toEqual({ value: '01', caret: 2, model: '01' });
        expect(await typed(date, '1500')).toEqual({ value: '15/01', caret: 5, model: '1501' });
        expect(await typed({ mask: 'M0/d0', leadZeroDateTime: true }, '1200')).toEqual({
            value: '12/01',
            caret: 5,
            model: '1201',
        });
    });

    it('keeps 00 without leadZeroDateTime', async () => {
        expect(await typed({ mask: 'd0/M0/0000' }, '1500')).toEqual({
            value: '15/00',
            caret: 5,
            model: '1500',
        });
    });

    it('round-trips a programmatically written 00 day or month unchanged', async () => {
        expect(await written(date, '00062020')).toEqual({
            value: '00/06/2020',
            caret: 10,
            model: '00062020',
        });
        expect(await written(date, '15002020')).toEqual({
            value: '15/00/2020',
            caret: 10,
            model: '15002020',
        });
    });

    it('types a 1 when Backspace empties the second digit of the month', async () => {
        expect(await backspaceAt(date, '15062020', 5)).toEqual({
            value: '15/01/2020',
            caret: 4,
            model: '15012020',
        });
    });

    it('pads the month instead of leaving 13 when Backspace deletes its second digit', async () => {
        expect(await backspaceAt({ mask: 'M0/d0', leadZeroDateTime: true }, '1231', 2)).toEqual({
            value: '01/31',
            caret: 1,
            model: '0131',
        });
    });

    it('turns a typed 12-hour 00 into 01 and keeps every digit', async () => {
        expect(await typed(twelveHour, '00')).toEqual({ value: '01', caret: 2, model: '01' });
        expect(await typed(twelveHour, '000000')).toEqual({
            value: '01:00:00',
            caret: 8,
            model: '010000',
        });
    });

    it('clamps a 00 hour of the lone hh token with apm, typed and pasted', async () => {
        const lone = { mask: 'hh:m0', apm: true, leadZeroDateTime: true };
        expect(await typed(lone, '0030')).toEqual({ value: '01:30', caret: 5, model: '0130' });
        expect(await pasted(lone, '0030')).toEqual({ value: '01:30', caret: 5, model: '0130' });
        expect(await written(lone, '0030')).toEqual({ value: '00:30', caret: 5, model: '0030' });
    });

    it('clamps a pasted 00 day or month but not a written one', async () => {
        expect(await pasted(date, '00062020')).toEqual({
            value: '01/06/2020',
            caret: 10,
            model: '01062020',
        });
        expect(await pasted(date, '15002020')).toEqual({
            value: '15/01/2020',
            caret: 10,
            model: '15012020',
        });
    });

    it('keeps a written 00 when Backspace edits another field', async () => {
        expect(await writtenThenBackspace(date, '00062020', 10)).toEqual({
            value: '00/06/202',
            caret: 9,
            model: '0006202',
        });
        expect(await writtenThenBackspace(date, '15002020', 10)).toEqual({
            value: '15/00/202',
            caret: 9,
            model: '1500202',
        });
        expect(await writtenThenBackspace(twelveHour, '000000', 8)).toEqual({
            value: '00:00:0',
            caret: 7,
            model: '00000',
        });
    });

    it('keeps a written 00 when Backspace removes only the separator after it', async () => {
        expect(await writtenThenBackspace(date, '00062020', 3)).toEqual({
            value: '00/06/2020',
            caret: 2,
            model: '00062020',
        });
        expect(await writtenThenBackspace(date, '15002020', 6)).toEqual({
            value: '15/00/2020',
            caret: 5,
            model: '15002020',
        });
    });

    it('keeps a written 00 and a 12-hour 00 without leadZeroDateTime', async () => {
        expect(await written(twelveHour, '000000')).toEqual({
            value: '00:00:00',
            caret: 8,
            model: '000000',
        });
        expect(await typed({ mask: 'Hh:m0:s0', apm: true }, '000000')).toEqual({
            value: '00:00:00',
            caret: 8,
            model: '000000',
        });
    });
});
