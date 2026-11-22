import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

describe('Separator: decimalMarker array overlapping the thousandSeparator (real browser)', () => {
    it('keeps every digit of a written 1,234.5 with a space thousandSeparator (#1745)', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            decimalMarker: ['.', ','],
            thousandSeparator: ' ',
        });

        m.component.form.setValue('1,234.5');
        await m.settle();

        expect(m.get('#masked').value).toBe('1 234.5');
    });

    it('formats a typed 1,234.5 with a space thousandSeparator without losing digits (#1745)', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            decimalMarker: ['.', ','],
            thousandSeparator: ' ',
        });

        await m.type('#masked', '1234.5');

        expect(m.get('#masked').value).toBe('1 234.5');
        expect(m.component.form.value).toBe(1234.5);
    });

    it('drops a typed comma that is also the thousandSeparator and keeps the dot decimal (#1744)', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            decimalMarker: ['.', ','],
            thousandSeparator: ',',
        });

        await m.type('#masked', '1234,5');
        expect(m.get('#masked').value).toBe('12,345');

        await m.clear('#masked');
        await m.type('#masked', '1234.5');
        expect(m.get('#masked').value).toBe('1,234.5');
        expect(m.component.form.value).toBe(1234.5);
    });

    it('leaves model writes with a single decimalMarker unchanged', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            decimalMarker: '.',
            thousandSeparator: ',',
        });

        m.component.form.setValue('1234.5');
        await m.settle();

        expect(m.get('#masked').value).toBe('1,234.5');
    });
});
