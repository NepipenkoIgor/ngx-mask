import type { ComDoc, MaskOptions, TExampleConfig } from '@shared/accordion/content.types';

export const OthDocs: ComDoc[] = [
    {
        header: 'Secure input',
        text: 'You can hide symbols in input field and get the actual value in formcontrol',
        code: ` <input [hiddenInput]="true" mask="XXX/X0/0000">`,
        id: 1,
        anchor: 'secure',
    },
    {
        header: 'Pipe',
        text: 'Also you can use mask pipe',
        code: ` <span>{{phone | mask: '(000) 000-0000'}}</span>`,
        id: 2,
        anchor: 'pipe',
    },
    {
        header: 'specialCharacters',
        text: '',
        // eslint-disable-next-line no-useless-escape
        code: ` <input type='text' [specialCharacters]="[ '[' ,']' , '\\' ]" mask="[00]\[000]" >`,
        id: 3,
        anchor: 'special',
    },
    {
        header: '12 hour format',
        text: '',

        code: ` <input type='text'[apm]="true" mask="Hh:m0:s0" >`,
        id: 4,
        anchor: '12hour',
    },
    {
        header: 'Percent with decimalMarker ,',
        text: '',

        code: ` <input type='text'[decimalMarker]="','" mask="percent.2" >`,
        id: 5,
        anchor: 'percentDecimalMarker',
    },
    {
        header: 'Percent with multiple decimalMarkers',
        text: 'Both `.` and `,` are accepted as the decimal marker of a percent mask',
        code: ` <input type='text' [decimalMarker]="['.', ',']" mask="percent.2" >`,
        id: 7,
        anchor: 'percentMultipleDecimalMarkers',
    },
    {
        header: 'Secure date input',
        text: 'You can also hide the day and month digits of a date while keeping the year visible',
        code: ` <input [hiddenInput]="true" mask="d0/M0/0000">`,
        id: 6,
        anchor: 'secure-date',
    },
];

export const OthExamples: (TExampleConfig<MaskOptions> | { _pipe: string })[] = [
    {
        _placeholder: 'Secure input',
        _hiddenInput: true,
        _mask: 'XXX/X0/0000',
        control: { initialValue: '', model: '' },
    },
    {
        _pipe: '(000) 000-0000',
    },
    {
        _placeholder: 'specialCharacters',
        _specialCharacters: `[ '[' ,']' , '\\' ]`,
        _mask: '[00][000]',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: '12 hour format',
        _mask: 'Hh:m0:s0',
        _apm: true,
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Percent with decimalMarker ,',
        _mask: 'percent.2',
        _decimalMarker: ',',
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Percent with multiple decimalMarkers',
        _mask: 'percent.2',
        _decimalMarker: ['.', ','],
        control: { initialValue: '', model: '' },
    },
    {
        _placeholder: 'Secure date input',
        _hiddenInput: true,
        _mask: 'd0/M0/0000',
        control: { initialValue: '', model: '' },
    },
];
