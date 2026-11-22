import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

describe('Separator: symbol thousand separators (real browser)', () => {
    const symbols = ['$', '*', '^', '|', "'"];

    it.each(symbols)('groups typed digits with %s and keeps the model numeric', async (symbol) => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            thousandSeparator: symbol,
        });

        await m.type('#masked', '1234567');

        expect(m.get('#masked').value).toBe(`1${symbol}234${symbol}567`);
        expect(m.component.form.value).toBe(1234567);
    });

    it.each(symbols)('keeps a decimal typed after grouping with %s', async (symbol) => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            thousandSeparator: symbol,
        });

        await m.type('#masked', '1234567.89');

        expect(m.get('#masked').value).toBe(`1${symbol}234${symbol}567.89`);
        expect(m.component.form.value).toBe(1234567.89);
    });

    it('writes a number with the star separator', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            thousandSeparator: '*',
        });

        m.component.form.setValue(1234567.5);
        await m.settle();

        expect(m.get('#masked').value).toBe('1*234*567.5');
        expect(m.component.form.value).toBe(1234567.5);
    });
});

describe('Separator: a thousandSeparator containing a digit is ignored (real browser)', () => {
    it.each(['1', '0'])(
        'types digits ungrouped and intact for %s',
        async (separator) => {
            const m = await mount(MaskHarnessComponent, {
                mask: 'separator.2',
                thousandSeparator: separator,
            });

            await m.type('#masked', '1234567.5');

            expect(m.get('#masked').value).toBe('1234567.5');
            expect(m.component.form.value).toBe(1234567.5);
        },
        10000
    );

    it.each(['1', '0'])(
        'writes a number intact for %s',
        async (separator) => {
            const m = await mount(MaskHarnessComponent, {
                mask: 'separator.2',
                thousandSeparator: separator,
            });

            m.component.form.setValue(1234567);
            await m.settle();

            expect(m.get('#masked').value).toBe('1234567');
            expect(m.component.form.value).toBe(1234567);
        },
        10000
    );
});

describe('Separator: strings written in the display format (real browser)', () => {
    const cases = [
        { ts: '.', dm: ',', written: '1.234,5' },
        { ts: ',', dm: '.', written: '1,234.5' },
        { ts: ' ', dm: ',', written: '1 234,5' },
    ];

    it.each(cases)('reads "$written" with ts "$ts" and dm "$dm"', async ({ ts, dm, written }) => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            thousandSeparator: ts,
            decimalMarker: dm,
        });

        m.component.form.setValue(written);
        await m.settle();

        expect(m.get('#masked').value).toBe(written);
    });

    it.each(cases)(
        'pads "$written" without NaN when leadZero is on',
        async ({ ts, dm, written }) => {
            const m = await mount(MaskHarnessComponent, {
                mask: 'separator.2',
                thousandSeparator: ts,
                decimalMarker: dm,
                leadZero: true,
            });

            m.component.form.setValue(written);
            await m.settle();

            expect(m.get('#masked').value).toBe(`${written}0`);
        }
    );

    it('keeps reading a lone dot as the decimal point', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            thousandSeparator: '.',
            decimalMarker: ',',
        });

        m.component.form.setValue('1234567.5');
        await m.settle();
        expect(m.get('#masked').value).toBe('1.234.567,5');

        m.component.form.setValue('1.5');
        await m.settle();
        expect(m.get('#masked').value).toBe('1,5');
    });
});

describe('Separator: leadZero with a comma decimal string (real browser)', () => {
    it.each(['.', ' '])('pads "1234567,5" with thousandSeparator "%s"', async (separator) => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            thousandSeparator: separator,
            // the library default: both '.' and ',' are accepted as the decimal marker
            decimalMarker: ['.', ','],
            leadZero: true,
        });

        m.component.form.setValue('1234567,5');
        await m.settle();

        expect(m.get('#masked').value).toBe(`1${separator}234${separator}567,50`);
    });
});

describe('Separator: leading-zero comma decimal with an array decimalMarker (real browser, #1726)', () => {
    it.each([
        ['0,', '0,', 0],
        ['0,1', '0,1', 0.1],
        ['0,05', '0,05', 0.05],
        ['0.1', '0.1', 0.1],
        ['0,5.', '0,5', 0.5],
        ['1,5.', '1,5', 1.5],
    ])('types %s into an empty field', async (keys, shown, model) => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            thousandSeparator: ' ',
            decimalMarker: ['.', ','],
        });

        await m.type('#masked', keys);

        expect(m.get('#masked').value).toBe(shown);
        expect(Number(m.component.form.value)).toBe(model);
    });
});

describe('Separator: a digit typed into the trailing placeholder before the suffix (real browser, #1720)', () => {
    it('keeps the display and the caret when typing right before the suffix', async () => {
        const m = await mount(MaskHarnessComponent, {
            mask: 'separator.2',
            prefix: '$',
            suffix: ' USD',
            showMaskTyped: true,
        });

        m.component.form.setValue(1234.56);
        await m.settle();
        const before = m.get('#masked').value;
        const end = before.length - ' USD'.length;
        m.select('#masked', end, end);
        await m.type('#masked', '5');
        expect(m.get('#masked').value).toBe(before);
        expect(m.get('#masked').selectionStart).toBe(end);
        expect(m.component.form.value).toBe(1234.56);
    });
});
