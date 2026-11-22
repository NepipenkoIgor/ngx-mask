import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

describe('one-character prefix: an edit with the caret at 1 (#1719)', () => {
    it('types the next digit into the slot a selection delete freed after the prefix', async () => {
        const m = await mount(MaskHarnessComponent, { mask: '0000', prefix: '$' });
        await m.type('#masked', '1234');
        const el = m.get('#masked');
        el.focus();
        el.setSelectionRange(1, 2);
        await userEvent.keyboard('{Backspace}5');
        await m.settle();

        await expect.poll(() => el.value).toBe('$5234');
        expect(m.component.form.value).toBe('5234');
    });
});
