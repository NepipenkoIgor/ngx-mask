import type { ComDoc, MaskOptions, TExampleConfig } from '@shared/accordion/content.types';

export const ComDocs: ComDoc[] = [
    {
        header: 'Date',
        text: '',
        code: `<input mask="d0/M0/0000" />`,
        id: 1,
        anchor: 'date',
    },
    {
        header: 'Date and hour',
        text: '',
        code: `<input mask="d0/M0/0000 Hh:m0:s0" />`,
        id: 2,
        anchor: 'date-and-hour',
    },
    {
        header: 'Valid 24 hour format',
        text: '',
        code: `<input mask="Hh:m0:s0" />`,
        id: 3,
        anchor: 'valid24',
    },
    {
        header: 'Mixed types',
        text: '',
        code: `<input mask="AAA 000-S0S" />`,
        id: 4,
        anchor: 'mixed',
    },
    {
        header: 'Valid date start with years',
        text: '',
        code: `<input mask="0000.M0.d0" />`,
        id: 5,
        anchor: 'startWithYears',
    },
    {
        header: 'Mask with specialCharacters',
        text: '',
        code: `<input
        [showMaskTyped]="true"
        [specialCharacters]="['e', 'x', 't', ' ', '(', ')', '-', '.']"
        shownMaskExpression="(___) ___-____ ext. ______"
        mask="(000) 000-0000 ext. 000000"
        >`,
        id: 6,
        anchor: 'mask-specialCharacters',
    },
    {
        header: 'Optional mask',
        text: '',
        code: `<input type='text' mask="9999 999 999" >`,
        id: 7,
        anchor: 'optional-mask',
    },
    {
        header: 'Email mask with validation',
        text: '',
        code: `<input mask="A*@A*.SSS" [validation]="true" [dropSpecialCharacters]="false" >`,
        id: 8,
        anchor: 'email-mask',
    },
    {
        header: 'Email mask with validation',
        text: '',
        code: `<input mask="A*@A*.A*" [validation]="true" [dropSpecialCharacters]="false" >`,
        id: 8,
        anchor: 'email-mask-any',
    },
    {
        header: 'Allow negative numbers to mask',
        text: 'You can allow negative numbers',
        code: ` <input type='text' mask="0000" [allowNegativeNumbers]="true">`,
        id: 9,
        anchor: 'allowMask',
    },
    {
        header: 'Allow negative numbers to separator',
        text: 'You can allow negative numbers to',
        code: ` <input type='text' mask="separator" [allowNegativeNumbers]="true">`,
        id: 9,
        anchor: 'allowSeparator',
    },
    {
        header: 'Allow negative numbers to percent',
        text: 'You can allow negative numbers',
        code: ` <input type='text' mask="percent.2" [allowNegativeNumbers]="true">`,
        id: 9,
        anchor: 'allowPercent',
    },
    {
        header: 'Allow few mask in one expression',
        text: '',
        code: `<input type='text' mask="(00) 00000000||+00 (00) 00000000" >`,
        id: 10,
        anchor: 'allow-few-mask',
    },
    {
        header: 'Allow few mask in one expression number or letter',
        text: '',
        code: `<input type='text' mask="00||SS" >`,
        id: 10,
        anchor: 'allow-few-mask-letters',
    },
    {
        header: 'IP address',
        text: '',
        code: `<input mask="IP" />`,
        id: 11,
        anchor: 'ip-address',
    },
    {
        header: 'CPF/CNPJ',
        text: '',
        code: `<input mask="CPF_CNPJ" />`,
        id: 12,
        anchor: 'cpf-cnpj',
    },
    {
        header: 'CPF/CNPJ alphanumeric',
        text: '',
        code: `<input mask="CPF_CNPJ_ALPHA" />`,
        id: 13,
        anchor: 'cpf-cnpj-alpha',
    },
    {
        header: 'Custom mask alias',
        text: 'Define named aliases once in the config and reference them by name.',
        code: `provideNgxMask({ maskAliases: { PHONE_BR: '(00) 00000-0000' } })

<input mask="PHONE_BR" />`,
        id: 14,
        anchor: 'mask-aliases',
    },
    {
        header: 'Smart cursor with leadZeroDateTime',
        text: 'When a typed digit overflows the current date/time segment, leadZeroDateTime auto-inserts a leading zero and moves the cursor past the separator instead of leaving it stuck.',
        code: `<input mask="M0/00" [leadZeroDateTime]="true" [showMaskTyped]="true" />`,
        id: 15,
        anchor: 'lead-zero-date-time',
    },
    {
        header: 'Date with leadZeroDateTime',
        text: 'With leadZeroDateTime a digit that cannot start a valid day or month is padded with a leading zero, and typing into a complete date overwrites the segment instead of shifting it.',
        code: `<input mask="d0/M0/0000" [leadZeroDateTime]="true" />`,
        id: 16,
        anchor: 'date-lead-zero-date-time',
    },
];

export const ComExamples: TExampleConfig<MaskOptions>[] = [
    {
        _placeholder: 'Date',
        _mask: 'd0/M0/0000',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Date and Hour',
        _mask: 'd0/M0/0000 Hh:m0:s0',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Valid 24 hour format',
        _mask: 'Hh:m0:s0',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Mixed Type',
        _mask: 'AAA 000-S0S',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Valid date start with years',
        _mask: '0000.M0.d0',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Mask with specialCharacters',
        _mask: '(000) 000-0000 ext. 000000',
        _showMaskTyped: true,
        _shownMaskExpression: '(___) ___-____ ext. ______',
        _specialCharacters: ['e', 'x', 't', ' ', '(', ')', '-', '.'],
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Optional mask',
        _mask: '9999 999 999',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Valid email',
        _mask: 'A*@A*.SSS',
        _validation: true,
        _dropSpecialCharacters: false,
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Valid email',
        _validation: true,
        _dropSpecialCharacters: false,
        _mask: 'A*@A*.A*',
        control: { initialValue: '', model: '' },
    },

    {
        _placeholder: 'allowNegativeNumbers mask',
        _allowNegativeNumbers: true,
        _mask: '0000',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'allowNegativeNumbers separator',
        _allowNegativeNumbers: true,
        _decimalMarker: '.',
        _mask: 'separator',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'allowNegativeNumbers percent',
        _decimalMarker: '.',
        _allowNegativeNumbers: true,
        _mask: 'percent.2',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Allow few mask in one expression',
        _mask: '(00) 00000000||+00 (00) 00000000',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Allow few mask in one expression',
        _mask: '00||SS',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'IP address',
        _mask: 'IP',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'CPF/CNPJ',
        _mask: 'CPF_CNPJ',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'CPF/CNPJ alphanumeric',
        _mask: 'CPF_CNPJ_ALPHA',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Custom mask alias (PHONE_BR)',
        _mask: 'PHONE_BR',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Smart cursor with leadZeroDateTime',
        _mask: 'M0/00',
        _leadZeroDateTime: true,
        _showMaskTyped: true,
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Date with leadZeroDateTime',
        _mask: 'd0/M0/0000',
        _leadZeroDateTime: true,
        control: { initialValue: '', model: '' },
    },
];
