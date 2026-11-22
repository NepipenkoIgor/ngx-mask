import { userEvent } from 'vitest/browser';
import type { Mounted } from './utils/browser-harness';
import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

/**
 * Edits with no keydown (execCommand/IME/dictation/autofill) must not reuse the previous key's
 * code or selection (#1709); a real paste in the middle of a fixed mask leaves the caret after
 * the pasted run (#1703); a hiddenInput paste or bulk insertion keeps the digits already typed
 * (#1702). The pastes are real: the text is copied from a scratch input, then pasted.
 */

const state = (m: Mounted<MaskHarnessComponent>): string => {
    const el = m.get('#masked');
    return `${el.value}|${m.component.form.value}|${el.selectionStart}`;
};

async function paste(m: Mounted<MaskHarnessComponent>, text: string): Promise<void> {
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
}

describe('keyless edits (real browser)', () => {
    it('#1709 insertText over a selection after Backspace (kCP, no smt)', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: '000-000',
            keepCharacterPositions: true,
        });
        await m.type('#masked', '123456');
        m.get('#masked').setSelectionRange(3, 7);
        await userEvent.keyboard('{Backspace}');
        await m.settle();
        document.execCommand('insertText', false, '9');
        await m.settle();
        expect(state(m)).toBe('123-9|1239|5');
    });

    it('#1709 insertText over a selection of a written value (kCP, smt)', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: '(000) 000-0000',
            keepCharacterPositions: true,
            showMaskTyped: true,
        });
        m.component.form.setValue('0123456789');
        await m.settle();
        m.focus('#masked');
        m.get('#masked').setSelectionRange(1, 3);
        document.execCommand('insertText', false, '5');
        await m.settle();
        expect(state(m)).toBe('(5_2) 345-6789|523456789|2');
    });

    it('#1703 caret after a real paste in the middle of a fixed mask', async () => {
        const m = await mount(MaskHarnessComponent, { mask: '0000-0000' });
        m.component.form.setValue('12345');
        await m.settle();
        await paste(m, '99');
        m.get('#masked').setSelectionRange(1, 1);
        await userEvent.paste();
        await m.settle();
        expect(state(m)).toBe('1992-345|1992345|3');
    });

    it('#1702 real paste at the end of a hiddenInput value', async () => {
        const m = await mount(MaskHarnessComponent, { mask: 'XXX-XX-0000', hiddenInput: true });
        await m.type('#masked', '12');
        await paste(m, '345');
        const el = m.get('#masked');
        el.setSelectionRange(el.value.length, el.value.length);
        await userEvent.paste();
        await m.settle();
        expect(state(m)).toBe('***-**|12345|6');
    });

    it('#1702 insertText of six digits after three typed characters in a hiddenInput', async () => {
        const m = await mount(MaskHarnessComponent, { mask: 'XXX-XX-0000', hiddenInput: true });
        m.focus('#masked');
        for (const c of '123') {
            document.execCommand('insertText', false, c);
            await m.settle();
        }
        document.execCommand('insertText', false, '456789');
        await m.settle();
        expect(m.component.form.value).toBe('123456789');
    });
});
