import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

/**
 * Real-chromium cases for editing a date: a whole selected field typed over (#1713), a pair of
 * digits inserted at once (#1714), Delete over a prefixed date (#1721) and the range rules of a
 * keepCharacterPositions date (#1724). Selections are placed with `setSelectionRange`, keys go
 * through `userEvent.keyboard`.
 */

type Config = Record<string, unknown>;

/** Writes `initial`, selects `from`-`to` (a caret when equal), runs `act` and reads the outcome. */
async function edit(
    config: Config,
    initial: string,
    from: number,
    to: number,
    act: (el: HTMLInputElement) => Promise<void> | void
): Promise<string> {
    const m = await mount(MaskHarnessComponent, config);
    m.component.form.setValue(initial);
    await m.settle();
    m.select('#masked', from, to);
    await act(m.get('#masked'));
    await m.settle();
    const el = m.get('#masked');
    return `${el.value}|${el.selectionStart}|${m.component.form.value}`;
}

const keys = (typed: string) => async (): Promise<void> => {
    await userEvent.keyboard(typed);
};

/** Splices `data` over the selection and fires `input` with no keydown before it (insertText). */
const insert = (data: string) => (el: HTMLInputElement) => {
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

/** Pastes `text` through the browser clipboard into the empty field. */
async function pasteInto(config: Config, text: string): Promise<string> {
    const m = await mount(MaskHarnessComponent, config);
    const scratch = document.createElement('input');
    document.body.appendChild(scratch);
    try {
        scratch.value = text;
        scratch.focus();
        scratch.select();
        await userEvent.copy();
    } finally {
        scratch.remove();
    }
    m.focus('#masked');
    await userEvent.paste();
    await m.settle();
    const el = m.get('#masked');
    return `${el.value}|${m.component.form.value}`;
}

describe('editing a date in a real browser', () => {
    it('types a day over a selected day without touching the year (#1713)', async () => {
        const date = { mask: 'd0/M0/0000' };
        expect(await edit(date, '15062020', 0, 2, keys('31'))).toBe('31/06/2020|2|31062020');
        expect(await edit(date, '15062020', 0, 2, keys('4'))).toBe('4/06/2020|1|4062020');
        expect(await edit(date, '15062020', 0, 0, keys('4'))).toBe('4/06/2020|1|4062020');
        expect(await edit(date, '15062020', 3, 5, keys('12'))).toBe('15/12/2020|5|15122020');
    });

    it('masks two digits inserted at once into a short date as an insertion (#1714)', async () => {
        const monthDay = { mask: 'M0/d0', leadZeroDateTime: true };
        expect(await edit(monthDay, '123', 0, 0, insert('45'))).toBe('04/05|5|0405');
    });

    it('deletes only the selected digit of a prefixed date (#1721)', async () => {
        const prefixed = { mask: 'd0/M0/0000', prefix: '+7 ' };
        expect(await edit(prefixed, '15062020', 3, 4, keys('{Delete}'))).toBe(
            '+7 5/06/2020|3|5062020'
        );
        expect(await edit(prefixed, '15062020', 4, 5, keys('{Delete}'))).toBe(
            '+7 1/06/2020|4|1062020'
        );
    });

    it('rejects a digit that puts a keepCharacterPositions field out of range (#1724)', async () => {
        const kcp = { mask: 'd0/M0/0000', keepCharacterPositions: true, showMaskTyped: true };
        expect(await edit(kcp, '15062020', 0, 0, keys('4'))).toBe('15/06/2020|0|15062020');
        expect(await edit(kcp, '15062020', 0, 0, keys('2'))).toBe('25/06/2020|1|25062020');
        expect(await edit(kcp, '15062020', 3, 3, keys('1'))).toBe('15/06/2020|3|15062020');
        expect(await edit(kcp, '', 0, 0, keys('00'))).toBe('0_/__/____|1|0');
    });

    it('types a run inserted into a complete date over the digits that follow it (#1747)', async () => {
        const date = { mask: 'd0/M0/0000' };
        expect(await edit(date, '12052024', 0, 0, insert('31'))).toBe('31/05/2024|2|31052024');
        expect(await edit(date, '12052024', 6, 6, insert('19'))).toBe('12/05/1924|8|12051924');
        expect(await edit(date, '12052024', 3, 5, insert('11'))).toBe('12/11/2024|5|12112024');
    });

    it('rejects a pasted keepCharacterPositions date with a field out of range (#1748)', async () => {
        const kcp = { mask: 'd0/M0/0000', keepCharacterPositions: true };
        expect(await pasteInto(kcp, '00062020')).toBe('|');
        expect(await pasteInto(kcp, '31132020')).toBe('|');
        expect(await pasteInto(kcp, '15062020')).toBe('15/06/2020|15062020');
        expect(await pasteInto({ ...kcp, showMaskTyped: true }, '00062020')).toBe('__/__/____|');
    });
});
