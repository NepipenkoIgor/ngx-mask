import { describe, expect, it } from 'vitest';

import {
    findDateTimeFieldAt,
    isFieldOverflowing,
    leadZeroDateTimeCaret,
    overwriteDateSlot,
    overwriteFullDateValue,
} from '../../lib/caret/date-overflow';
import { MaskExpression } from '../../lib/ngx-mask-expression.enum';

describe('findDateTimeFieldAt', () => {
    it('locates the field a caret sits in, up to the separator after it', () => {
        expect(findDateTimeFieldAt('d0/M0/0000', 1)).toMatchObject({
            token: 'd',
            start: 0,
            end: 2,
        });
        expect(findDateTimeFieldAt('d0/M0/0000', 2)).toMatchObject({
            token: 'd',
            start: 0,
            end: 2,
        });
        expect(findDateTimeFieldAt('d0/M0/0000', 4)).toMatchObject({
            token: 'M',
            start: 3,
            end: 5,
        });
    });

    it('treats Hh as one combined hour field', () => {
        expect(findDateTimeFieldAt('Hh:m0', 1)).toMatchObject({ token: 'H', start: 0, end: 2 });
        expect(findDateTimeFieldAt('Hh:m0', 4)).toMatchObject({ token: 'm', start: 3, end: 5 });
    });

    it('treats hh as one combined hour field too', () => {
        expect(findDateTimeFieldAt('hh:m0', 1)).toMatchObject({ token: 'h', start: 0, end: 2 });
        expect(findDateTimeFieldAt('hh:m0', 4)).toMatchObject({ token: 'm', start: 3, end: 5 });
    });

    it('finds nothing in a mask without date or time tokens, or past the last field', () => {
        expect(findDateTimeFieldAt('000-000', 2)).toBeNull();
        expect(findDateTimeFieldAt('d0/M0/0000', 8)).toBeNull();
    });
});

describe('isFieldOverflowing', () => {
    const day = { token: 'd', start: 0, end: 2 } as const;
    const month = { token: 'M', start: 3, end: 5 } as const;
    const hours = { token: 'H', start: 0, end: 2 } as const;

    it('flags a completed out-of-range two digit value', () => {
        expect(isFieldOverflowing(day, 2, '33', '33', false)).toBe(true);
        expect(isFieldOverflowing(day, 2, '31', '31', false)).toBe(false);
        expect(isFieldOverflowing(month, 5, '12/13', '12/13', false)).toBe(true);
    });

    it('flags a first digit that cannot lead a valid value', () => {
        expect(isFieldOverflowing(day, 1, '4', '4', false)).toBe(true);
        expect(isFieldOverflowing(month, 4, '12/3', '12/3', false)).toBe(true);
        expect(isFieldOverflowing(month, 4, '12/1', '12/1', false)).toBe(false);
    });

    it('uses the twelve hour limits with apm', () => {
        expect(isFieldOverflowing(hours, 2, '13', '13', false)).toBe(false);
        expect(isFieldOverflowing(hours, 2, '24', '24', false)).toBe(true);
        expect(isFieldOverflowing(hours, 2, '10', '10', true)).toBe(false);
        expect(isFieldOverflowing(hours, 2, '12', '12', true)).toBe(false);
        expect(isFieldOverflowing(hours, 2, '13', '13', true)).toBe(true);
    });
});

describe('leadZeroDateTimeCaret', () => {
    it('moves the caret two chars on past an overflowing field', () => {
        expect(leadZeroDateTimeCaret('d0/M0/0000', 1, '4', '4', false)).toBe(3);
    });

    it('keeps the caret otherwise', () => {
        expect(leadZeroDateTimeCaret('d0/M0/0000', 1, '2', '2', false)).toBe(1);
        expect(leadZeroDateTimeCaret('000-000', 1, '9', '9', false)).toBe(1);
    });
});

describe('overwriteFullDateValue', () => {
    it('drops the character after the caret of a full d0/M0/0000 value', () => {
        expect(overwriteFullDateValue('d0/M0/0000', '121/23456', 3, 'Digit1')).toBe('12123456');
    });

    it('leaves the value on backspace, on another mask, or at the end of the date', () => {
        expect(overwriteFullDateValue('d0/M0/0000', '121/23456', 3, MaskExpression.BACKSPACE)).toBe(
            null
        );
        expect(overwriteFullDateValue('Hh:m0:s0', '121/23456', 3, 'Digit1')).toBeNull();
        expect(overwriteFullDateValue('d0/M0/0000', '121/23456', 10, 'Digit1')).toBeNull();
        expect(overwriteFullDateValue('d0/M0/0000', '12', 2, 'Digit1')).toBeNull();
    });
});

describe('overwriteDateSlot', () => {
    type Svc = Parameters<typeof overwriteDateSlot>[0];
    const service = (mask: string, options: Partial<Svc> = {}): Svc => ({
        maskExpression: mask,
        specialCharacters: ['/', '.', ':', ' ', '-'],
        _checkSymbolMask: (symbol: string, maskChar: string) =>
            /\d/.test(symbol) && /[0dMHhms]/.test(maskChar),
        leadZeroDateTime: true,
        apm: false,
        ...options,
    });
    /** Types `key` at `caret` of the full display `before`; `to` makes it a selection `caret`-`to`. */
    const type = (svc: Svc, before: string, caret: number, key: string, to = caret) =>
        overwriteDateSlot(svc, before, before.slice(0, caret) + key + before.slice(to), caret + 1);

    it('overwrites the next digit slot, skipping separators', () => {
        const svc = service('d0/M0/0000');
        expect(type(svc, '15/06/2020', 1, '9')).toMatchObject({
            value: '19/06/2020',
            position: 2,
        });
        expect(type(svc, '15/06/2020', 2, '1')).toMatchObject({
            value: '15/10/2020',
            position: 4,
        });
        expect(type(svc, '15/06/2020', 5, '7')).toMatchObject({
            value: '15/06/7020',
            position: 7,
        });
        expect(type(svc, '15/06/2020', 6, '1')).toMatchObject({
            value: '15/06/1020',
            position: 7,
        });
    });

    it('zero-fills a tens digit that would push the field out of range', () => {
        const svc = service('d0/M0/0000');
        expect(type(svc, '15/06/2020', 0, '3')).toMatchObject({
            value: '30/06/2020',
            position: 1,
        });
        expect(type(svc, '15/06/2020', 3, '1')).toMatchObject({
            value: '15/10/2020',
            position: 4,
        });
    });

    it('makes a digit that cannot be a tens digit the whole field', () => {
        const svc = service('d0/M0/0000');
        expect(type(svc, '15/06/2020', 0, '4')).toMatchObject({
            value: '04/06/2020',
            position: 2,
        });
        expect(type(svc, '15/06/2020', 4, '9')).toMatchObject({
            value: '15/09/2020',
            position: 5,
        });
        expect(type(svc, '31/12/2020', 1, '5')).toMatchObject({
            value: '05/12/2020',
            position: 2,
        });
    });

    it('repairs a digit typed over a whole selected field the same way', () => {
        const svc = service('d0/M0/0000');
        expect(type(svc, '15/06/2020', 0, '3', 2)).toMatchObject({
            value: '30/06/2020',
            position: 1,
        });
        expect(type(svc, '15/06/2020', 3, '1', 5)).toMatchObject({
            value: '15/10/2020',
            position: 4,
        });
        expect(type(svc, '15/06/2020', 0, '4', 2)).toMatchObject({
            value: '04/06/2020',
            position: 2,
        });
        expect(type(svc, '15/06/2020', 3, '4', 5)).toMatchObject({
            value: '15/04/2020',
            position: 5,
        });
        // the handler turns the 00 into 01 (leadZeroDateTime)
        expect(type(svc, '15/06/2020', 3, '0', 5)).toMatchObject({
            value: '15/00/2020',
            position: 4,
        });
    });

    it('reports the last index the edit touches, none for a rejected key', () => {
        const svc = service('d0/M0/0000');
        expect(type(svc, '15/06/2020', 1, '9')?.end).toBe(2);
        expect(type(svc, '15/06/2020', 3, '1', 5)?.end).toBe(4);
        expect(type(svc, '15/06/2020', 3, '4', 5)?.end).toBe(5);
        expect(type(svc, '15/06/2020', 1, 'a')?.end).toBe(-1);
    });

    it('uses the limits of the time fields of a composite mask', () => {
        const svc = service('d0/M0/0000 Hh:m0:s0');
        const before = '15/06/2020 12:30:45';
        expect(type(svc, before, 11, '9')?.value).toBe('15/06/2020 09:30:45');
        expect(type(svc, before, 14, '7')?.value).toBe('15/06/2020 12:07:45');
        expect(type(svc, before, 17, '9')?.value).toBe('15/06/2020 12:30:09');
        expect(type(svc, before, 18, '7')?.value).toBe('15/06/2020 12:30:47');
        expect(type(svc, before, 11, '2')?.value).toBe('15/06/2020 22:30:45');
    });

    it('uses the twelve hour limit with apm', () => {
        const svc = service('d0/M0/0000 Hh:m0:s0', { apm: true });
        expect(type(svc, '15/06/2020 12:30:45', 11, '2')?.value).toBe('15/06/2020 02:30:45');
        expect(type(svc, '15/06/2020 12:30:45', 11, '1')?.value).toBe('15/06/2020 12:30:45');
    });

    it('finds the day of a mask without separators at a field boundary', () => {
        const svc = service('0000M0d0');
        expect(type(svc, '20201231', 6, '4')).toMatchObject({ value: '20201204', position: 8 });
        expect(type(svc, '20201231', 4, '4')).toMatchObject({ value: '20200431', position: 6 });
    });

    it('leaves a year digit, a one-digit field and a field still holding a placeholder as they are', () => {
        expect(type(service('0000.M0.d0'), '2020.12.31', 3, '9')?.value).toBe('2029.12.31');
        expect(type(service('d/M/0000'), '5/6/2020', 0, '4')).toMatchObject({
            value: '4/6/2020',
            position: 1,
        });
        // showMaskTyped: the handler pads the lone 4 itself and moves the caret past the separator
        expect(type(service('d0/M0/0000'), '1_/__/____', 0, '4')).toMatchObject({
            value: '4_/__/____',
            position: 1,
        });
    });

    it('repairs a field without leadZeroDateTime, padding nothing (#1713)', () => {
        const svc = service('d0/M0/0000', { leadZeroDateTime: false });
        expect(type(svc, '15/06/2020', 1, '9')?.value).toBe('19/06/2020');
        // a digit that can be a tens digit zero-fills and keeps its slot
        expect(type(svc, '15/06/2020', 0, '3')).toMatchObject({ value: '30/06/2020', position: 1 });
        expect(type(svc, '15/06/2020', 0, '3', 2)).toMatchObject({
            value: '30/06/2020',
            position: 1,
        });
        // one that cannot is the whole field, unpadded
        expect(type(svc, '15/06/2020', 0, '4')).toMatchObject({ value: '4/06/2020', position: 1 });
        expect(type(svc, '15/06/2020', 3, '5', 5)).toMatchObject({
            value: '15/5/2020',
            position: 4,
        });
        // a lone 0 is left to the handler
        expect(type(svc, '15/06/2020', 3, '0', 5)).toBeNull();
    });

    it('rejects a key the slot does not accept and keeps the display', () => {
        const svc = service('d0/M0/0000');
        expect(type(svc, '15/06/2020', 1, 'a')).toMatchObject({
            value: '15/06/2020',
            position: 1,
        });
        expect(type(svc, '15/06/2020', 3, 'a', 5)).toMatchObject({
            value: '15/06/2020',
            position: 3,
        });
    });

    it('stays out of an edit that is not one character typed into a full date', () => {
        const svc = service('d0/M0/0000');
        expect(type(svc, '15/06/20', 1, '9')).toBeNull();
        expect(type(service('Hh:m0:s0'), '12:30:45', 1, '9')).toBeNull();
        expect(overwriteDateSlot(svc, '15/06/2020', '9', 1)).toBeNull();
        expect(type(svc, '15/06/2020', 1, '9', 4)).toBeNull();
        expect(type(svc, '15/06/2020', 6, '9', 8)).toBeNull();
        expect(overwriteDateSlot(svc, '15/06/2020', '25/06/2020', 2)).toBeNull();
        // a paste of more than one character, at the end of the value and in the middle of it
        expect(overwriteDateSlot(svc, '15/06/2020', '1256/06/2020', 4)).toBeNull();
        expect(overwriteDateSlot(svc, '15/06/2020', '15/5506/2020', 5)).toBeNull();
    });

    it('leaves two digits inserted at once into a short display to the caller (#1714)', () => {
        const svc = service('M0/d0');
        // `45` at 0 of `12/3`: the value is one longer than the mask, the display read from it
        // (`412/3`) has a digit where the mask has its separator
        expect(overwriteDateSlot(svc, '12/3', '4512/3', 2)).toBeNull();
    });

    it('reads the display from the value when no keydown recorded it', () => {
        const svc = service('d0/M0/0000');
        // `before` still holds the written raw value, or nothing at all
        expect(overwriteDateSlot(svc, '15062020', '195/06/2020', 2)).toMatchObject({
            value: '19/06/2020',
            position: 2,
        });
        expect(overwriteDateSlot(svc, '', '415/06/2020', 1)).toMatchObject({
            value: '04/06/2020',
            position: 2,
        });
        // a selection cannot be read from the value: a stale `before` leaves it to the caller
        expect(overwriteDateSlot(svc, '15062020', '15/1/2020', 4)).toBeNull();
        expect(overwriteDateSlot(svc, '15/06/2021', '15/1/2020', 4)).toBeNull();
    });
});
