import type { ComDoc, MaskOptions, TExampleConfig } from '@shared/accordion/content.types';

// `typeFromDecimals` is a v22 directive input not yet present in the shared
// MaskOptions type (git submodule) — extend it locally until the submodule catches up.
type SepMaskOptions = MaskOptions & { _typeFromDecimals: boolean };

export const SepDocs: ComDoc[] = [
    {
        header: 'Thousand separator',
        text: 'You can divide your input by thousands',
        code: `<input type='text' mask="separator">`,
        id: 1,
        anchor: 'sep',
    },
    {
        header: 'Lead zero at model',
        text: 'You can divide your input by thousands',
        code: `<input type='text' mask="separator.2" [leadZero]="true">`,
        id: 2,
        anchor: 'lead-zero',
    },
    {
        header: 'Dot separator',
        text: 'For separate input with dots',
        code: `<input type='text' mask="separator.2" thousandSeparator="." decimalMarker="," />`,
        id: 3,
        anchor: 'Dsep',
    },
    {
        header: 'Comma separator',
        text: `For separate input with commas`,
        code: `<input type='text' mask="separator.2" thousandSeparator="," decimalMarker="." />`,
        id: 4,
        anchor: 'comma_sep',
    },
    {
        header: 'Zero separator',
        text: 'You can divide your input by thousands',
        code: `<input type='text' mask="separator.0">`,
        id: 5,
        anchor: 'sep0',
    },
    {
        header: 'Banking mode',
        text: 'ATM-style typing: digits fill the value from the decimal end (1 → 0.01, 12 → 0.12, 123 → 1.23)',
        code: `<input type='text' mask="separator.2" [typeFromDecimals]="true" thousandSeparator="," />`,
        id: 6,
        anchor: 'banking',
    },
    {
        header: 'Numpad decimal key',
        text: 'With decimalMarker "," the numeric keypad decimal key inserts "," (a "." typed on the main keyboard is still the thousand separator)',
        code: `<input type='text' mask="separator.2" thousandSeparator="." decimalMarker="," />`,
        id: 7,
        anchor: 'numpadDecimal',
    },
];

export const SepExamples: TExampleConfig<SepMaskOptions>[] = [
    {
        _placeholder: 'Separator',
        _mask: 'separator',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Separator 2 leadZero',
        _leadZero: true,
        _mask: 'separator.2',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'separator.2',
        _mask: 'separator.2',
        _thousandSeparator: '.',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'separator.2',
        _mask: 'separator.2',
        _thousandSeparator: ',',
        _decimalMarker: '.',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'separator.0',
        _mask: 'separator.0',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Banking mode',
        _mask: 'separator.2',
        _typeFromDecimals: true,
        _thousandSeparator: ',',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Numpad decimal key',
        _mask: 'separator.2',
        _thousandSeparator: '.',
        _decimalMarker: ',',
        control: { initialValue: '', model: '' },
    },
];
