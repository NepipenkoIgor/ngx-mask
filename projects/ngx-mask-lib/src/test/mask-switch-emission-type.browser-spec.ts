import { mount } from './utils/browser-harness';
import { MaskSwitchHost } from './utils/mask-switch-host';

describe('Emission type after a runtime mask switch matches a fresh mount in a real browser (#1701)', () => {
    it('"" -> separator.2 emits a number, separator.2 -> plain digits a string', async () => {
        const m = await mount(MaskSwitchHost);

        m.component.mask.set('separator.2');
        await m.settle();
        await m.type('#masked', '1234.5');
        await m.settle();

        expect(m.get('#masked').value).toBe('1 234.5');
        expect(m.component.control.value).toBe(1234.5);

        m.component.control.setValue('');
        m.component.mask.set('0000');
        await m.settle();
        await m.type('#masked', '1234');
        await m.settle();

        expect(m.component.control.value).toBe('1234');
    });
});
