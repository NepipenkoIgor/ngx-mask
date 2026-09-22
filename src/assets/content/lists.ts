import type { ListItem } from '@shared/accordion/content.types';

export const lists: ListItem[] = [
    {
        header: 'Common cases',
        id: 1,
        defaultSvg: 'common-cases',
        activeSvg: 'common-cases-active',
        whiteChevron: 'white-chevron-down',
        yellowChevron: 'yellow-chevron-down',
        text: [
            {
                content: 'Date',
                id: 1,
                scrollTo: 'date',
            },
            {
                content: 'Date and hour',
                id: 2,
                scrollTo: 'date-and-hour',
            },
            {
                content: 'Valid 24 hour format',
                id: 3,
                scrollTo: 'valid24',
            },
            {
                content: 'Mixed types',
                id: 4,
                scrollTo: 'mixed',
            },
            {
                content: 'Valid date start with years',
                id: 5,
                scrollTo: 'startWithYears',
            },
            {
                content: 'SpecialCharacters Mask',
                id: 6,
                scrollTo: 'mask-specialCharacters',
            },
            {
                content: 'Optional mask',
                id: 7,
                scrollTo: 'optional-mask',
            },
            {
                content: 'Validation email mask',
                id: 8,
                scrollTo: 'email-mask',
            },
            {
                content: 'allowNegativeNumber',
                id: 9,
                scrollTo: 'allowMask',
            },
            {
                content: 'Allow few mask in one expression',
                id: 10,
                scrollTo: 'allow-few-mask',
            },
            {
                content: 'IP address',
                id: 11,
                scrollTo: 'ip-address',
            },
            {
                content: 'CPF/CNPJ',
                id: 12,
                scrollTo: 'cpf-cnpj',
            },
            {
                content: 'CPF/CNPJ alphanumeric',
                id: 13,
                scrollTo: 'cpf-cnpj-alpha',
            },
            {
                content: 'Custom mask alias',
                id: 14,
                scrollTo: 'mask-aliases',
            },
        ],
    },
    {
        header: 'Options',
        id: 2,
        defaultSvg: 'options',
        activeSvg: 'options-active',
        whiteChevron: 'white-chevron-down',
        yellowChevron: 'yellow-chevron-down',
        text: [
            {
                content: 'Prefix',
                id: 1,
                scrollTo: 'prefix',
            },
            {
                content: 'Suffix',
                id: 2,
                scrollTo: 'suffix',
            },
            {
                content: 'dropSpecialCharacters',
                id: 3,
                scrollTo: 'special-ch',
            },
            {
                content: 'showMaskTyped',
                id: 4,
                scrollTo: 'show-mask',
            },
            {
                content: 'clearIfNotMatch',
                id: 5,
                scrollTo: 'clear',
            },
            {
                content: 'Validation',
                id: 6,
                scrollTo: 'valid',
            },
            {
                content: 'Keep Character Position',
                id: 7,
                scrollTo: 'keep000',
            },
            {
                content: 'defaultValueOnBlur',
                id: 8,
                scrollTo: 'default-value-blur',
            },
        ],
    },
    {
        header: 'Parser and Formatter',
        id: 5,
        defaultSvg: 'parser-and-formatter',
        activeSvg: 'parser-and-formatter-active',
        whiteChevron: 'white-chevron-down',
        yellowChevron: 'yellow-chevron-down',
        text: [
            {
                content: 'To upper case',
                id: 1,
                scrollTo: 'toUpperCase',
            },
            {
                content: 'To local date',
                id: 2,
                scrollTo: 'to_date',
            },
            {
                content: 'Change decimalMarker',
                id: 3,
                scrollTo: 'replace_dot',
            },
            {
                content: 'Value toFixed(2)',
                id: 4,
                scrollTo: 'toFixed',
            },
        ],
    },
    {
        header: 'Separators',
        id: 3,
        defaultSvg: 'separator',
        activeSvg: 'separator-active',
        whiteChevron: 'white-chevron-down',
        yellowChevron: 'yellow-chevron-down',
        text: [
            {
                content: 'Separator',
                id: 1,
                scrollTo: 'sep',
            },
            {
                content: 'Separator leadZero',
                id: 2,
                scrollTo: 'lead-zero',
            },
            {
                content: 'Dot separator',
                id: 3,
                scrollTo: 'Dsep',
            },
            {
                content: 'Comma separator',
                id: 4,
                scrollTo: 'comma_sep',
            },
            {
                content: 'Zero separator',
                id: 5,
                scrollTo: 'sep0',
            },
            {
                content: 'Banking mode',
                id: 6,
                scrollTo: 'banking',
            },
            {
                content: 'Numpad decimal key',
                id: 7,
                scrollTo: 'numpadDecimal',
            },
        ],
    },
    {
        header: 'Other',
        id: 4,
        defaultSvg: 'other',
        activeSvg: 'other-active',
        whiteChevron: 'white-chevron-down',
        yellowChevron: 'yellow-chevron-down',
        text: [
            {
                content: 'Secure input',
                id: 1,
                scrollTo: 'secure',
            },
            {
                content: 'Pipe',
                id: 2,
                scrollTo: 'pipe',
            },
            {
                content: 'specialCharacters',
                id: 3,
                scrollTo: 'special',
            },
            {
                content: '12 hour format',
                id: 4,
                scrollTo: '12hour',
            },
            {
                content: 'Percent with comma',
                id: 5,
                scrollTo: 'percentDecimalMarker',
            },
            {
                content: 'Percent with multiple decimal markers',
                id: 7,
                scrollTo: 'percentMultipleDecimalMarkers',
            },
        ],
    },
];
