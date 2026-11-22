import { userEvent } from 'vitest/browser';
import type { Mounted } from './utils/browser-harness';
import { copyToClipboard, mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

/**
 * Real keys and pastes: a rejected key keeps the caret (#1746), a keyless insert keeps the
 * showMaskTyped suffix (#1749), a hiddenInput selection edit and a hiddenInput + showMaskTyped
 * paste splice the real value (#1750, #1752). jsdom twin: input-edits.spec.ts.
 */

const state = (m: Mounted<MaskHarnessComponent>): string => {
    const el = m.get('#masked');
    return `${el.value}|${m.component.form.value}|${el.selectionStart}`;
};

describe('input edits (real browser)', () => {
    it('#1746 a rejected letter keeps the caret on a non-separator mask', async () => {
        const m = await mount(MaskHarnessComponent, { mask: '000-000' });
        m.component.form.setValue('123456');
        await m.settle();
        m.focus('#masked');
        m.get('#masked').setSelectionRange(2, 2);
        await userEvent.keyboard('a');
        await m.settle();
        expect(state(m)).toBe('123-456|123456|2');
    });

    it('#1746 an accepted digit that drops an identical trailing one advances the caret', async () => {
        const m = await mount(MaskHarnessComponent, { mask: '000-000' });
        m.component.form.setValue('111111');
        await m.settle();
        m.focus('#masked');
        m.get('#masked').setSelectionRange(2, 2);
        await userEvent.keyboard('1');
        await m.settle();
        expect(state(m)).toBe('111-111|111111|3');
    });

    it('#1749 a keyless insert keeps the showMaskTyped suffix', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: '0 000',
            suffix: '$',
            showMaskTyped: true,
            keepCharacterPositions: true,
        });
        m.component.form.setValue('1234');
        await m.settle();
        m.focus('#masked');
        m.get('#masked').setSelectionRange(6, 6);
        document.execCommand('insertText', false, '9');
        await m.settle();
        expect(m.get('#masked').value).toBe('1 234$');
    });

    it('#1750 a typed key replaces the selection of a hiddenInput', async () => {
        const m = await mount(MaskHarnessComponent, { mask: 'XXX-XX-0000', hiddenInput: true });
        await m.type('#masked', '12345');
        m.get('#masked').setSelectionRange(1, 3);
        await userEvent.keyboard('9');
        await m.settle();
        expect(m.component.form.value).toBe('1945');
    });

    it('#1750 a keyless insert replaces the selection of a hiddenInput', async () => {
        const m = await mount(MaskHarnessComponent, { mask: 'XXX-XX-0000', hiddenInput: true });
        await m.type('#masked', '12345');
        m.get('#masked').setSelectionRange(1, 3);
        document.execCommand('insertText', false, '9');
        await m.settle();
        expect(m.component.form.value).toBe('1945');
    });

    it('#1752 a real paste into hiddenInput + showMaskTyped extends the real value', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'XXX-XX-0000',
            hiddenInput: true,
            showMaskTyped: true,
        });
        await m.type('#masked', '12');
        await copyToClipboard('345');
        m.focus('#masked');
        await userEvent.paste();
        await m.settle();
        expect(m.component.form.value).toBe('12345');
    });
});
