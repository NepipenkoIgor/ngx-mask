import { describe, expect, it } from 'vitest';

import type {
    KeepCharacterPositionsEdit,
    KeepCharacterPositionsResult,
    KeepCharacterPositionsState,
} from '../../lib/caret/keep-character-positions';
import { resolveKeepCharacterPositions } from '../../lib/caret/keep-character-positions';
import { MaskExpression } from '../../lib/ngx-mask-expression.enum';

const digitOnly = (symbol: string, maskSymbol: string): boolean =>
    maskSymbol === '0' && /\d/.test(symbol);

type Case = Partial<KeepCharacterPositionsState> & Partial<KeepCharacterPositionsEdit>;

function input(overrides: Case): Required<Case> {
    return {
        elValue: '',
        position: 0,
        code: 'Digit5',
        before: '',
        prefix: '',
        suffix: '',
        showMaskTyped: true,
        maskExpression: '00-00',
        maskIsShown: '__-__',
        placeHolderCharacter: '_',
        specialCharacters: ['-'],
        selStart: 0,
        selEnd: 0,
        actualValue: '',
        apm: false,
        _checkSymbolMask: digitOnly,
        ...overrides,
    };
}

function resolve(c: Required<Case>): KeepCharacterPositionsResult {
    const { elValue, position, code, before, ...state } = c;
    return resolveKeepCharacterPositions(state, { elValue, position, code, before });
}

describe('resolveKeepCharacterPositions', () => {
    it('leaves a placeholder behind a backspaced character', () => {
        expect(
            resolve(input({ elValue: '12-4', position: 3, code: MaskExpression.BACKSPACE }))
        ).toEqual({ actualValue: '12-_4', position: 3, handled: true });
    });

    it('leaves a placeholder at a deleted character and steps past it', () => {
        expect(
            resolve(input({ elValue: '2-34', position: 0, code: MaskExpression.DELETE }))
        ).toEqual({ actualValue: '_2-34', position: 1, handled: true });
    });

    it('hands the deletion of the last character to regular masking without showMaskTyped', () => {
        expect(
            resolve(
                input({
                    elValue: '12-3',
                    position: 4,
                    code: MaskExpression.BACKSPACE,
                    showMaskTyped: false,
                    maskIsShown: '',
                })
            )
        ).toEqual({ actualValue: null, position: 4, handled: false });
    });

    it('leaves the caret on the first blank of a deleted selection, unlike a collapsed Delete', () => {
        const selection = { elValue: '12-4', position: 2, selStart: 2, selEnd: 3 };
        expect(
            resolve(input({ ...selection, code: MaskExpression.DELETE, before: '12-34' }))
        ).toMatchObject({ position: 2 });
        expect(
            resolve(input({ elValue: '2-34', position: 0, code: MaskExpression.DELETE }))
        ).toMatchObject({ position: 1 });
    });

    it('blanks a deleted selection to the mask skeleton', () => {
        expect(
            resolve(
                input({
                    elValue: '-34',
                    position: 0,
                    code: MaskExpression.BACKSPACE,
                    selStart: 0,
                    selEnd: 2,
                })
            )
        ).toEqual({ actualValue: '__-34', position: 0, handled: true });
    });

    it('overwrites the first fillable slot with a typed symbol', () => {
        expect(resolve(input({ elValue: '5__-__', position: 1 }))).toEqual({
            actualValue: '5_-__',
            position: 1,
            handled: true,
        });
    });

    it('skips a special character to land the typed symbol', () => {
        expect(resolve(input({ elValue: '125-__', position: 3 }))).toEqual({
            actualValue: '12-5_',
            position: 4,
            handled: true,
        });
    });

    it('rejects a symbol the slot does not accept and keeps the display', () => {
        expect(resolve(input({ elValue: 'a__-__', position: 1 }))).toEqual({
            actualValue: null,
            position: 0,
            handled: true,
        });
    });

    it('rejects a symbol typed inside the prefix', () => {
        expect(resolve(input({ elValue: '5+1__', position: 1, prefix: '+1' }))).toEqual({
            actualValue: null,
            position: 0,
            handled: true,
        });
    });

    it('puts a symbol that replaced a selection into the first fillable slot of it', () => {
        expect(resolve(input({ elValue: '9-34', position: 1, selStart: 0, selEnd: 2 }))).toEqual({
            actualValue: '9_-34',
            position: 1,
            handled: true,
        });
    });

    it('hands a replaced whole value to regular masking without showMaskTyped', () => {
        expect(
            resolve(
                input({
                    elValue: '9',
                    position: 1,
                    selStart: 0,
                    selEnd: 5,
                    showMaskTyped: false,
                    maskIsShown: '',
                })
            )
        ).toEqual({ actualValue: null, position: 1, handled: false });
    });

    it('hands an append at the end to regular masking without showMaskTyped', () => {
        expect(
            resolve(input({ elValue: '12-3', position: 4, showMaskTyped: false, maskIsShown: '' }))
        ).toEqual({ actualValue: null, position: 4, handled: false });
    });

    describe('restoring the display from before the edit', () => {
        it('keeps the display when a single symbol is rejected', () => {
            expect(
                resolve(
                    input({ elValue: '1a2-34', position: 2, before: '12-34', actualValue: '12-34' })
                )
            ).toEqual({
                actualValue: '12-34',
                position: 1,
                handled: true,
            });
        });

        it('keeps the display when every slot is consumed', () => {
            expect(
                resolve(
                    input({ elValue: '12-345', position: 6, before: '12-34', actualValue: '12-34' })
                )
            ).toEqual({
                actualValue: '12-34',
                position: 5,
                handled: true,
            });
        });

        it('keeps the display when a symbol is typed inside the prefix', () => {
            expect(
                resolve(
                    input({
                        elValue: '5+1__',
                        position: 1,
                        prefix: '+1',
                        before: '+1__',
                        actualValue: '+1__',
                    })
                )
            ).toEqual({ actualValue: '+1__', position: 0, handled: true });
        });

        it('keeps the display when a symbol replacing a selection is rejected', () => {
            expect(
                resolve(
                    input({
                        elValue: 'a-34',
                        position: 1,
                        selStart: 0,
                        selEnd: 2,
                        before: '12-34',
                        actualValue: '12-34',
                    })
                )
            ).toEqual({ actualValue: '12-34', position: 0, handled: true });
        });

        it('leaves an empty field to regular masking', () => {
            // the display before the key is a bare skeleton: nothing of it is worth restoring
            expect(
                resolve(input({ elValue: '__-__5', position: 6, before: '__-__', actualValue: '' }))
            ).toEqual({ actualValue: null, position: 5, handled: true });
        });

        it('falls back when the display from before is not the one the edit started from', () => {
            // wrong length: the element was re-rendered between the keydown and the edit
            expect(
                resolve(
                    input({ elValue: '1a2-34', position: 2, before: '1234', actualValue: '1234' })
                )
            ).toEqual({
                actualValue: null,
                position: 1,
                handled: true,
            });
            expect(
                resolve(
                    input({
                        elValue: 'a-34',
                        position: 1,
                        selStart: 0,
                        selEnd: 2,
                        before: '1234',
                        actualValue: '1234',
                    })
                )
            ).toEqual({ actualValue: '__-34', position: 0, handled: true });
            // wrong head: the text in front of the selection differs
            expect(
                resolve(
                    input({
                        elValue: '1a34',
                        position: 2,
                        selStart: 1,
                        selEnd: 3,
                        before: '99-34',
                        actualValue: '99-34',
                    })
                )
            ).toEqual({ actualValue: '1_-34', position: 1, handled: true });
        });

        it('does not move the caret in front of the prefix', () => {
            expect(
                resolve(
                    input({
                        elValue: '+a-34',
                        position: 2,
                        prefix: '+7 ',
                        selStart: 1,
                        selEnd: 5,
                        before: '+7 12-34',
                        actualValue: '+7 12-34',
                    })
                )
            ).toEqual({ actualValue: '+7 12-34', position: 3, handled: true });
        });
    });

    describe('selections that reach into the prefix or the suffix', () => {
        it('keeps the prefix when the selection starts inside it', () => {
            expect(
                resolve(
                    input({
                        elValue: '+9-34',
                        position: 2,
                        prefix: '+7 ',
                        selStart: 1,
                        selEnd: 5,
                        before: '+7 12-34',
                    })
                )
            ).toEqual({ actualValue: '+7 9_-34', position: 4, handled: true });
        });

        it('types the pressed digit when the selection starts on a one-character prefix', () => {
            // `position` is shifted by the prefix for a first character: it must not pick the next one
            expect(
                resolve(
                    input({
                        elValue: '9-34',
                        position: 2,
                        prefix: '$',
                        selStart: 0,
                        selEnd: 3,
                        before: '$12-34',
                    })
                )
            ).toEqual({ actualValue: '$9_-34', position: 2, handled: true });
        });

        it('keeps the suffix when the selection reaches into it', () => {
            expect(
                resolve(
                    input({
                        elValue: '19g',
                        position: 2,
                        suffix: ' kg',
                        maskExpression: '000',
                        maskIsShown: '___',
                        specialCharacters: [],
                        selStart: 1,
                        selEnd: 5,
                        before: '123 kg',
                    })
                )
            ).toEqual({ actualValue: '19_ kg', position: 2, handled: true });
        });

        it('types into the first slot when the selection ends inside the prefix', () => {
            // the rest of the prefix behind the selection is skipped
            expect(
                resolve(
                    input({
                        elValue: '9 12-34',
                        position: 1,
                        prefix: '+7 ',
                        selStart: 0,
                        selEnd: 2,
                        before: '+7 12-34',
                        actualValue: '+7 12-34',
                    })
                )
            ).toEqual({ actualValue: '+7 92-34', position: 4, handled: true });
        });

        it('trims the gaps in front of the suffix when a deletion reaches the end of the number', () => {
            expect(
                resolve(
                    input({
                        elValue: '1 kg',
                        position: 1,
                        code: MaskExpression.BACKSPACE,
                        suffix: ' kg',
                        showMaskTyped: false,
                        maskExpression: '000-000',
                        maskIsShown: '',
                        specialCharacters: ['-'],
                        selStart: 1,
                        selEnd: 3,
                        before: '123 kg',
                        actualValue: '123 kg',
                    })
                )
            ).toEqual({ actualValue: '1 kg', position: 1, handled: true });
        });

        it('keeps the suffix when the selection reaches into it without showMaskTyped', () => {
            // the suffix follows the last digit, the display is shorter than the skeleton
            expect(
                resolve(
                    input({
                        elValue: '19g',
                        position: 2,
                        suffix: ' kg',
                        showMaskTyped: false,
                        maskExpression: '000-000',
                        maskIsShown: '',
                        specialCharacters: ['-'],
                        selStart: 1,
                        selEnd: 5,
                        before: '123 kg',
                        actualValue: '123 kg',
                    })
                )
            ).toEqual({ actualValue: '19_ kg', position: 2, handled: true });
        });
    });

    describe('deleting a selection of a value written through the control', () => {
        it('keeps the mask tail that the bare actualValue lacks', () => {
            expect(
                resolve(
                    input({
                        code: MaskExpression.BACKSPACE,
                        maskExpression: '000-000',
                        maskIsShown: '___-___',
                        elValue: '12-___',
                        position: 2,
                        selStart: 2,
                        selEnd: 3,
                        before: '123-___',
                        actualValue: '123',
                    })
                )
            ).toEqual({ actualValue: '12_-___', position: 2, handled: true });
        });
    });

    describe('deleting a selection that reaches the end without showMaskTyped', () => {
        const bare = {
            showMaskTyped: false,
            maskExpression: '000-000',
            maskIsShown: '',
            specialCharacters: ['-'],
            code: MaskExpression.BACKSPACE,
        };

        it('drops the trailing placeholders and separators', () => {
            expect(
                resolve(input({ ...bare, elValue: '123-', position: 4, selStart: 4, selEnd: 7 }))
            ).toEqual({ actualValue: '123', position: 4, handled: true });
        });

        it('keeps the gaps in front of the last digit', () => {
            expect(
                resolve(
                    input({
                        ...bare,
                        elValue: '1_3-',
                        position: 4,
                        selStart: 4,
                        selEnd: 7,
                        actualValue: '1_3-456',
                    })
                )
            ).toEqual({ actualValue: '1_3', position: 4, handled: true });
        });

        it('never trims into the prefix', () => {
            expect(
                resolve(
                    input({
                        ...bare,
                        specialCharacters: ['-', ' ', '+'],
                        elValue: '+7 _',
                        position: 4,
                        prefix: '+7 ',
                        selStart: 4,
                        selEnd: 10,
                        actualValue: '+7 _23-456',
                    })
                )
            ).toEqual({ actualValue: '+7 ', position: 4, handled: true });
        });

        it('keeps the caret in front of the suffix when Delete trims the end of the number', () => {
            expect(
                resolve(
                    input({
                        ...bare,
                        code: MaskExpression.DELETE,
                        specialCharacters: ['-', ' ', '+'],
                        elValue: '+7 1 kg',
                        position: 4,
                        prefix: '+7 ',
                        suffix: ' kg',
                        selStart: 4,
                        selEnd: 10,
                        before: '+7 123-456 kg',
                        actualValue: '+7 123-456 kg',
                    })
                )
            ).toEqual({ actualValue: '+7 1 kg', position: 4, handled: true });
        });

        it('keeps the placeholders with showMaskTyped', () => {
            expect(
                resolve(
                    input({
                        ...bare,
                        showMaskTyped: true,
                        maskIsShown: '___-___',
                        elValue: '123-',
                        position: 4,
                        selStart: 4,
                        selEnd: 7,
                    })
                )
            ).toEqual({ actualValue: '123-___', position: 4, handled: true });
        });
    });
});
