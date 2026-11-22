import { afterEach, describe, expect, it, vi } from 'vitest';
import { By } from '@angular/platform-browser';

import type {
    CharacterizationHarness,
    EditAction,
    EditSnapshot,
} from './utils/characterization-harness';
import { createHarness } from './utils/characterization-harness';
import { pasteTest } from './utils/test-functions.component';
import type { TestMaskComponent } from './utils/test-component.component';

/**
 * Characterization of the date/time overflow handling of `NgxMaskDirective` input processing:
 * the per-field thresholds (day 31, month 12, hour 23 or 12 with apm, minutes and seconds 59),
 * the leadZeroDateTime caret shift and the apm / d0/M0/0000 tweaks. Every expectation records
 * what the directive does TODAY, so a later extraction can be proven behaviour-preserving.
 * Rows marked `// current behaviour` look odd on purpose: they are pinned, not endorsed.
 */

type Config = Partial<{
    [
        K in keyof TestMaskComponent as TestMaskComponent[K] extends { set: unknown } ? K : never
    ]: TestMaskComponent[K] extends { set: (v: infer V) => void } ? V : never;
}>;

type Row = {
    /** Value written through the form control before anything else. */
    initial?: string;
    /** Characters typed key by key at the caret; \b is Backspace. */
    keys?: string;
    /** Value pasted into the input. */
    paste?: string;
    /** One edit at an explicit selection, applied after `initial` / `keys`. */
    edit?: EditAction;
    expected: Pick<EditSnapshot, 'value' | 'caret' | 'model'>;
};

async function run(config: Config, row: Row): Promise<EditSnapshot> {
    const harness = createHarness();
    for (const [key, value] of Object.entries(config)) {
        (harness.component as unknown as Record<string, { set: (v: unknown) => void }>)[key]?.set(
            value
        );
    }
    harness.fixture.detectChanges();
    // Land the configuration's deferred writes before the user acts, as a real page would.
    await harness.settle();
    if (typeof row.initial === 'string') {
        await harness.write(row.initial);
    }
    if (typeof row.paste === 'string') {
        pasteTest(row.paste, harness.fixture);
        await harness.settle();
    }
    if (typeof row.keys === 'string') {
        await harness.type(row.keys);
    }
    return row.edit ? harness.edit(row.edit) : harness.snapshot();
}

function describeRow(row: Row): string {
    if (typeof row.keys === 'string') {
        return `typing ${JSON.stringify(row.keys).replace(/\\\\b/g, '<Backspace>')}`;
    }
    if (typeof row.paste === 'string') {
        return `pasting "${row.paste}"`;
    }
    if (!row.edit) {
        return `writing "${row.initial}"`;
    }
    const { start, end, key } = row.edit;
    return `${row.initial} then ${key} at ${start}${end === start ? '' : `-${end}`}`;
}

function check(config: Config, rows: Row[]): void {
    for (const row of rows) {
        it(describeRow(row), async () => {
            const snap = await run(config, row);
            expect({ value: snap.value, caret: snap.caret, model: snap.model }).toEqual(
                row.expected
            );
        });
    }
}

/** One `describe` per configuration, so rows of different masks never share a test title. */
function section(title: string, config: Config, rows: Row[]): void {
    describe(title, () => {
        check(config, rows);
    });
}

describe('date overflow characterization', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('d0/M0/0000 typing a date key by key', () => {
        const config: Config = { mask: 'd0/M0/0000', leadZeroDateTime: true };
        check(config, [
            { keys: '1', expected: { value: '1', caret: 1, model: '1' } },
            { keys: '3', expected: { value: '3', caret: 1, model: '3' } },
            { keys: '4', expected: { value: '04', caret: 2, model: '04' } },
            { keys: '9', expected: { value: '09', caret: 2, model: '09' } },
            { keys: '31', expected: { value: '31', caret: 2, model: '31' } },
            { keys: '32', expected: { value: '03/02', caret: 5, model: '0302' } },
            { keys: '35', expected: { value: '03/05', caret: 5, model: '0305' } },
            { keys: '39', expected: { value: '03/09', caret: 5, model: '0309' } },
            { keys: '40', expected: { value: '04/0', caret: 4, model: '040' } },
            // a typed 00 day is clamped to 01 (leadZeroDateTime, user input only)
            { keys: '00', expected: { value: '01', caret: 2, model: '01' } },
            { keys: '0', expected: { value: '0', caret: 1, model: '0' } },
            { keys: '01', expected: { value: '01', caret: 2, model: '01' } },
            { keys: '3112', expected: { value: '31/12', caret: 5, model: '3112' } },
            { keys: '311', expected: { value: '31/1', caret: 4, model: '311' } },
            // current behaviour: an overflowing month is padded to 01 and the next digit becomes the year
            { keys: '3113', expected: { value: '31/01/3', caret: 7, model: '31013' } },
            { keys: '312', expected: { value: '31/02', caret: 5, model: '3102' } },
            { keys: '10', expected: { value: '10', caret: 2, model: '10' } },
            { keys: '13', expected: { value: '13', caret: 2, model: '13' } },
            { keys: '15', expected: { value: '15', caret: 2, model: '15' } },
            { keys: '152', expected: { value: '15/02', caret: 5, model: '1502' } },
            { keys: '1522', expected: { value: '15/02/2', caret: 7, model: '15022' } },
            { keys: '153', expected: { value: '15/03', caret: 5, model: '1503' } },
            { keys: '15062020', expected: { value: '15/06/2020', caret: 10, model: '15062020' } },
            { keys: '3112202099', expected: { value: '31/12/2020', caret: 10, model: '31122020' } },
            { keys: '29022024', expected: { value: '29/02/2024', caret: 10, model: '29022024' } },
            { keys: '41', expected: { value: '04/1', caret: 4, model: '041' } },
            { keys: '4112', expected: { value: '04/11/2', caret: 7, model: '04112' } },
            { keys: '1512', expected: { value: '15/12', caret: 5, model: '1512' } },
            { keys: '15013', expected: { value: '15/01/3', caret: 7, model: '15013' } },
            { keys: '150', expected: { value: '15/0', caret: 4, model: '150' } },
            // a typed 00 month is clamped to 01
            { keys: '1500', expected: { value: '15/01', caret: 5, model: '1501' } },
        ]);
    });

    describe('d0/M0/0000 without leadZeroDateTime', () => {
        const config: Config = { mask: 'd0/M0/0000' };
        check(config, [
            { keys: '4', expected: { value: '4', caret: 1, model: '4' } },
            { keys: '45', expected: { value: '4/5', caret: 3, model: '45' } },
            { keys: '32', expected: { value: '3/2', caret: 3, model: '32' } },
            { keys: '3112', expected: { value: '31/12', caret: 5, model: '3112' } },
            { keys: '3113', expected: { value: '31/1/3', caret: 6, model: '3113' } },
            { keys: '15062020', expected: { value: '15/06/2020', caret: 10, model: '15062020' } },
            { keys: '13', expected: { value: '13', caret: 2, model: '13' } },
        ]);
    });

    describe('d0/M0/0000 editing inside an existing date', () => {
        const config: Config = { mask: 'd0/M0/0000', leadZeroDateTime: true };
        check(config, [
            {
                initial: '15062020',
                edit: { start: 1, end: 1, key: '9' },
                expected: { value: '19/06/2020', caret: 2, model: '19062020' },
            },
            {
                initial: '15062020',
                edit: { start: 1, end: 1, key: '4' },
                expected: { value: '14/06/2020', caret: 2, model: '14062020' },
            },
            {
                initial: '15062020',
                edit: { start: 0, end: 0, key: '4' },
                expected: { value: '04/06/2020', caret: 2, model: '04062020' },
            },
            {
                initial: '15062020',
                edit: { start: 0, end: 0, key: '3' },
                expected: { value: '30/06/2020', caret: 1, model: '30062020' },
            },
            {
                initial: '15062020',
                edit: { start: 2, end: 2, key: '3' },
                expected: { value: '15/03/2020', caret: 5, model: '15032020' },
            },
            {
                initial: '15062020',
                edit: { start: 3, end: 3, key: '3' },
                expected: { value: '15/03/2020', caret: 5, model: '15032020' },
            },
            {
                initial: '15062020',
                edit: { start: 3, end: 3, key: '1' },
                expected: { value: '15/10/2020', caret: 4, model: '15102020' },
            },
            {
                initial: '15062020',
                edit: { start: 4, end: 4, key: '3' },
                expected: { value: '15/03/2020', caret: 5, model: '15032020' },
            },
            {
                initial: '15062020',
                edit: { start: 4, end: 4, key: '9' },
                expected: { value: '15/09/2020', caret: 5, model: '15092020' },
            },
            {
                initial: '15062020',
                edit: { start: 5, end: 5, key: '7' },
                expected: { value: '15/06/7020', caret: 7, model: '15067020' },
            },
            {
                initial: '15062020',
                edit: { start: 6, end: 6, key: '1' },
                expected: { value: '15/06/1020', caret: 7, model: '15061020' },
            },
            {
                initial: '15062020',
                edit: { start: 9, end: 9, key: '7' },
                expected: { value: '15/06/2027', caret: 10, model: '15062027' },
            },
            {
                initial: '15062020',
                edit: { start: 10, end: 10, key: '7' },
                expected: { value: '15/06/2020', caret: 10, model: '15062020' },
            },
            {
                initial: '15062020',
                edit: { start: 0, end: 2, key: '4' },
                expected: { value: '04/06/2020', caret: 2, model: '04062020' },
            },
            {
                initial: '15062020',
                edit: { start: 0, end: 2, key: '3' },
                expected: { value: '30/06/2020', caret: 1, model: '30062020' },
            },
            {
                initial: '15062020',
                edit: { start: 3, end: 5, key: '1' },
                expected: { value: '15/10/2020', caret: 4, model: '15102020' },
            },
            {
                initial: '15062020',
                edit: { start: 3, end: 5, key: '4' },
                expected: { value: '15/04/2020', caret: 5, model: '15042020' },
            },
            {
                initial: '1506',
                edit: { start: 1, end: 1, key: '9' },
                expected: { value: '19/05/06', caret: 2, model: '190506' },
            },
            {
                initial: '1506',
                edit: { start: 1, end: 1, key: '4' },
                expected: { value: '14/05/06', caret: 2, model: '140506' },
            },
            {
                initial: '1506',
                edit: { start: 4, end: 4, key: '3' },
                expected: { value: '15/03/6', caret: 5, model: '15036' },
            },
            {
                initial: '1506',
                edit: { start: 5, end: 5, key: '3' },
                expected: { value: '15/06/3', caret: 7, model: '15063' },
            },
            {
                initial: '15',
                edit: { start: 1, end: 1, key: '4' },
                expected: { value: '14/05', caret: 2, model: '1405' },
            },
            {
                initial: '15',
                edit: { start: 2, end: 2, key: '3' },
                expected: { value: '15/03', caret: 5, model: '1503' },
            },
        ]);
    });

    describe('d0/M0/0000 Backspace and Delete', () => {
        const config: Config = { mask: 'd0/M0/0000', leadZeroDateTime: true };
        check(config, [
            {
                initial: '15062020',
                edit: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '01/06/2020', caret: 1, model: '01062020' },
            },
            {
                initial: '15062020',
                edit: { start: 3, end: 3, key: 'Backspace' },
                expected: { value: '15/06/2020', caret: 2, model: '15062020' },
            },
            {
                initial: '15062020',
                edit: { start: 4, end: 4, key: 'Backspace' },
                expected: { value: '15/06/2020', caret: 3, model: '15062020' },
            },
            {
                initial: '15062020',
                edit: { start: 10, end: 10, key: 'Backspace' },
                expected: { value: '15/06/202', caret: 9, model: '1506202' },
            },
            {
                initial: '15062020',
                edit: { start: 1, end: 1, key: 'Backspace' },
                expected: { value: '05/06/2020', caret: 0, model: '05062020' },
            },
            {
                initial: '15062020',
                edit: { start: 0, end: 0, key: 'Delete' },
                expected: { value: '05/06/2020', caret: 0, model: '05062020' },
            },
            {
                initial: '15062020',
                edit: { start: 2, end: 2, key: 'Delete' },
                expected: { value: '15/06/2020', caret: 3, model: '15062020' },
            },
            {
                initial: '15062020',
                edit: { start: 0, end: 10, key: 'Backspace' },
                expected: { value: '', caret: 0, model: '' },
            },
            {
                initial: '15062020',
                edit: { start: 0, end: 2, key: 'Backspace' },
                expected: { value: '06/02/020', caret: 0, model: '0602020' },
            },
            { keys: '1506\b\b', expected: { value: '15/', caret: 3, model: '15' } },
            { keys: '15062\b\b\b', expected: { value: '15/0', caret: 4, model: '150' } },
            { keys: '31\b', expected: { value: '3', caret: 1, model: '3' } },
            { keys: '4\b', expected: { value: '0', caret: 1, model: '0' } },
            { keys: '3112\b3', expected: { value: '31/01/3', caret: 7, model: '31013' } },
        ]);
    });

    describe('d0/M0/0000 pasting', () => {
        const config: Config = { mask: 'd0/M0/0000', leadZeroDateTime: true };
        check(config, [
            { paste: '15062020', expected: { value: '15/06/2020', caret: 10, model: '15062020' } },
            { paste: '32132020', expected: { value: '03/02/1320', caret: 10, model: '03021320' } },
            { paste: '3', expected: { value: '3', caret: 1, model: '3' } },
            { paste: '45', expected: { value: '04/05', caret: 5, model: '0405' } },
        ]);
    });

    describe('0000.M0.d0 typing a date key by key', () => {
        const config: Config = { mask: '0000.M0.d0', leadZeroDateTime: true };
        check(config, [
            { keys: '2020', expected: { value: '2020', caret: 4, model: '2020' } },
            { keys: '20201', expected: { value: '2020.1', caret: 6, model: '20201' } },
            { keys: '20203', expected: { value: '2020.03', caret: 7, model: '202003' } },
            { keys: '20204', expected: { value: '2020.04', caret: 7, model: '202004' } },
            // an overflowing month is padded to 01 and the next digit becomes the day, as in d0/M0/0000
            { keys: '202013', expected: { value: '2020.01.3', caret: 9, model: '2020013' } },
            { keys: '202012', expected: { value: '2020.12', caret: 7, model: '202012' } },
            { keys: '2020123', expected: { value: '2020.12.3', caret: 9, model: '2020123' } },
            { keys: '2020124', expected: { value: '2020.12.04', caret: 10, model: '20201204' } },
            { keys: '20201231', expected: { value: '2020.12.31', caret: 10, model: '20201231' } },
            { keys: '20201232', expected: { value: '2020.12.03', caret: 10, model: '20201203' } },
            { keys: '20201235', expected: { value: '2020.12.03', caret: 10, model: '20201203' } },
            { keys: '20201240', expected: { value: '2020.12.04', caret: 10, model: '20201204' } },
            { keys: '20200', expected: { value: '2020.0', caret: 6, model: '20200' } },
            { keys: '202000', expected: { value: '2020.01', caret: 7, model: '202001' } },
            { keys: '2020120', expected: { value: '2020.12.0', caret: 9, model: '2020120' } },
            { keys: '20201200', expected: { value: '2020.12.01', caret: 10, model: '20201201' } },
            { keys: '202002', expected: { value: '2020.02', caret: 7, model: '202002' } },
            { keys: '2020021', expected: { value: '2020.02.1', caret: 9, model: '2020021' } },
        ]);
    });

    describe('0000.M0.d0 editing inside an existing date', () => {
        const config: Config = { mask: '0000.M0.d0', leadZeroDateTime: true };
        check(config, [
            {
                initial: '20201231',
                edit: { start: 5, end: 5, key: '0' },
                expected: { value: '2020.02.31', caret: 6, model: '20200231' },
            },
            {
                initial: '20201231',
                edit: { start: 5, end: 5, key: '3' },
                expected: { value: '2020.03.31', caret: 7, model: '20200331' },
            },
            // 4 over the month's tens digit cannot be a tens digit: the month is 04, the day stays
            {
                initial: '20201231',
                edit: { start: 6, end: 6, key: '4' },
                expected: { value: '2020.04.31', caret: 7, model: '20200431' },
            },
            {
                initial: '20201231',
                edit: { start: 6, end: 6, key: '1' },
                expected: { value: '2020.11.31', caret: 7, model: '20201131' },
            },
            {
                initial: '20201231',
                edit: { start: 7, end: 7, key: '4' },
                expected: { value: '2020.12.04', caret: 10, model: '20201204' },
            },
            {
                initial: '20201231',
                edit: { start: 8, end: 8, key: '4' },
                expected: { value: '2020.12.04', caret: 10, model: '20201204' },
            },
            {
                initial: '20201231',
                edit: { start: 8, end: 8, key: '2' },
                expected: { value: '2020.12.21', caret: 9, model: '20201221' },
            },
            {
                initial: '20201231',
                edit: { start: 9, end: 9, key: '5' },
                expected: { value: '2020.12.05', caret: 10, model: '20201205' },
            },
            {
                initial: '20201231',
                edit: { start: 9, end: 9, key: '2' },
                expected: { value: '2020.12.02', caret: 10, model: '20201202' },
            },
            {
                initial: '20201231',
                edit: { start: 10, end: 10, key: '2' },
                expected: { value: '2020.12.31', caret: 10, model: '20201231' },
            },
            {
                initial: '20201231',
                edit: { start: 3, end: 3, key: '9' },
                expected: { value: '2029.12.31', caret: 4, model: '20291231' },
            },
            // a digit over the whole selected month zero-fills like an overwrite: the day is never read as its second digit
            {
                initial: '20201231',
                edit: { start: 5, end: 7, key: '1' },
                expected: { value: '2020.10.31', caret: 6, model: '20201031' },
            },
            {
                initial: '20201231',
                edit: { start: 8, end: 10, key: '4' },
                expected: { value: '2020.12.04', caret: 10, model: '20201204' },
            },
        ]);
    });

    describe('0000.M0.d0 Backspace', () => {
        const config: Config = { mask: '0000.M0.d0', leadZeroDateTime: true };
        check(config, [
            {
                initial: '20201231',
                edit: { start: 5, end: 5, key: 'Backspace' },
                expected: { value: '2020.12.31', caret: 4, model: '20201231' },
            },
            {
                initial: '20201231',
                edit: { start: 8, end: 8, key: 'Backspace' },
                expected: { value: '2020.12.31', caret: 7, model: '20201231' },
            },
            {
                initial: '20201231',
                edit: { start: 10, end: 10, key: 'Backspace' },
                expected: { value: '2020.12.3', caret: 9, model: '2020123' },
            },
            {
                initial: '20201231',
                edit: { start: 9, end: 9, key: 'Backspace' },
                expected: { value: '2020.12.1', caret: 8, model: '2020121' },
            },
            { keys: '20201231\b\b', expected: { value: '2020.12.', caret: 8, model: '202012' } },
        ]);
    });

    describe('Hh:m0:s0 typing a time key by key', () => {
        const config: Config = { mask: 'Hh:m0:s0', leadZeroDateTime: true };
        check(config, [
            { keys: '1', expected: { value: '1', caret: 1, model: '1' } },
            { keys: '2', expected: { value: '2', caret: 1, model: '2' } },
            { keys: '3', expected: { value: '03', caret: 2, model: '03' } },
            { keys: '9', expected: { value: '09', caret: 2, model: '09' } },
            { keys: '23', expected: { value: '23', caret: 2, model: '23' } },
            // an hour above 23 is padded to 02 and the digit starts the minutes
            { keys: '24', expected: { value: '02:4', caret: 4, model: '024' } },
            { keys: '25', expected: { value: '02:5', caret: 4, model: '025' } },
            { keys: '29', expected: { value: '02:09', caret: 5, model: '0209' } },
            { keys: '30', expected: { value: '03:0', caret: 4, model: '030' } },
            { keys: '00', expected: { value: '00', caret: 2, model: '00' } },
            { keys: '0', expected: { value: '0', caret: 1, model: '0' } },
            { keys: '12', expected: { value: '12', caret: 2, model: '12' } },
            { keys: '123', expected: { value: '12:3', caret: 4, model: '123' } },
            { keys: '126', expected: { value: '12:06', caret: 5, model: '1206' } },
            { keys: '1259', expected: { value: '12:59', caret: 5, model: '1259' } },
            { keys: '125', expected: { value: '12:5', caret: 4, model: '125' } },
            // by design: the 6 can only be a tens-of-minutes digit, so it is padded (like 3113 in dates)
            { keys: '1260', expected: { value: '12:06:0', caret: 7, model: '12060' } },
            { keys: '1261', expected: { value: '12:06:1', caret: 7, model: '12061' } },
            { keys: '12345', expected: { value: '12:34:5', caret: 7, model: '12345' } },
            { keys: '123459', expected: { value: '12:34:59', caret: 8, model: '123459' } },
            { keys: '123456', expected: { value: '12:34:56', caret: 8, model: '123456' } },
            { keys: '1234', expected: { value: '12:34', caret: 5, model: '1234' } },
            { keys: '12346', expected: { value: '12:34:06', caret: 8, model: '123406' } },
            { keys: '123460', expected: { value: '12:34:06', caret: 8, model: '123406' } },
            { keys: '235959', expected: { value: '23:59:59', caret: 8, model: '235959' } },
            { keys: '236000', expected: { value: '23:06:00', caret: 8, model: '230600' } },
            { keys: '246060', expected: { value: '02:46:06', caret: 8, model: '024606' } },
            { keys: '2359599', expected: { value: '23:59:59', caret: 8, model: '235959' } },
            { keys: '1200', expected: { value: '12:00', caret: 5, model: '1200' } },
            { keys: '12000', expected: { value: '12:00:0', caret: 7, model: '12000' } },
        ]);
    });

    describe('Hh:m0:s0 without leadZeroDateTime', () => {
        const config: Config = { mask: 'Hh:m0:s0' };
        check(config, [
            { keys: '3', expected: { value: '3', caret: 1, model: '3' } },
            { keys: '25', expected: { value: '2:5', caret: 3, model: '25' } },
            { keys: '236060', expected: { value: '23:6:06', caret: 7, model: '23606' } },
            { keys: '235959', expected: { value: '23:59:59', caret: 8, model: '235959' } },
        ]);
    });

    describe('Hh:m0:s0 editing inside an existing time', () => {
        const config: Config = { mask: 'Hh:m0:s0', leadZeroDateTime: true };
        check(config, [
            {
                initial: '123456',
                edit: { start: 1, end: 1, key: '9' },
                expected: { value: '19:23:45', caret: 2, model: '192345' },
            },
            {
                initial: '123456',
                edit: { start: 0, end: 0, key: '3' },
                expected: { value: '03:12:34', caret: 4, model: '031234' },
            },
            {
                initial: '123456',
                edit: { start: 0, end: 0, key: '2' },
                expected: { value: '21:23:45', caret: 1, model: '212345' },
            },
            {
                initial: '123456',
                edit: { start: 1, end: 1, key: '5' },
                expected: { value: '15:23:45', caret: 2, model: '152345' },
            },
            {
                initial: '123456',
                edit: { start: 2, end: 2, key: '5' },
                expected: { value: '12:53:45', caret: 4, model: '125345' },
            },
            {
                initial: '123456',
                edit: { start: 3, end: 3, key: '6' },
                expected: { value: '12:06:34', caret: 7, model: '120634' },
            },
            {
                initial: '123456',
                edit: { start: 3, end: 3, key: '1' },
                expected: { value: '12:13:45', caret: 4, model: '121345' },
            },
            {
                initial: '123456',
                edit: { start: 4, end: 4, key: '9' },
                expected: { value: '12:39:45', caret: 5, model: '123945' },
            },
            {
                initial: '123456',
                edit: { start: 4, end: 4, key: '0' },
                expected: { value: '12:30:45', caret: 5, model: '123045' },
            },
            {
                initial: '123456',
                edit: { start: 5, end: 5, key: '7' },
                expected: { value: '12:34:07', caret: 8, model: '123407' },
            },
            {
                initial: '123456',
                edit: { start: 6, end: 6, key: '6' },
                expected: { value: '12:34:06', caret: 8, model: '123406' },
            },
            {
                initial: '123456',
                edit: { start: 7, end: 7, key: '7' },
                expected: { value: '12:34:57', caret: 8, model: '123457' },
            },
            {
                initial: '123456',
                edit: { start: 8, end: 8, key: '0' },
                expected: { value: '12:34:56', caret: 8, model: '123456' },
            },
            {
                initial: '123456',
                edit: { start: 0, end: 2, key: '3' },
                expected: { value: '03:34:56', caret: 4, model: '033456' },
            },
            {
                initial: '123456',
                edit: { start: 3, end: 5, key: '6' },
                expected: { value: '12:06:56', caret: 7, model: '120656' },
            },
            {
                initial: '123456',
                edit: { start: 6, end: 8, key: '7' },
                expected: { value: '12:34:07', caret: 8, model: '123407' },
            },
        ]);
    });

    describe('Hh:m0:s0 Backspace', () => {
        const config: Config = { mask: 'Hh:m0:s0', leadZeroDateTime: true };
        check(config, [
            {
                initial: '123456',
                edit: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '13:45:06', caret: 1, model: '134506' },
            },
            {
                initial: '123456',
                edit: { start: 3, end: 3, key: 'Backspace' },
                expected: { value: '12:34:56', caret: 2, model: '123456' },
            },
            {
                initial: '123456',
                edit: { start: 8, end: 8, key: 'Backspace' },
                expected: { value: '12:34:5', caret: 7, model: '12345' },
            },
            {
                initial: '123456',
                edit: { start: 6, end: 6, key: 'Backspace' },
                expected: { value: '12:34:56', caret: 5, model: '123456' },
            },
            {
                initial: '123456',
                edit: { start: 1, end: 1, key: 'Delete' },
                expected: { value: '13:45:06', caret: 1, model: '134506' },
            },
            { keys: '1234\b\b', expected: { value: '12:', caret: 3, model: '12' } },
        ]);
    });

    describe('Hh:m0 aa typing a 12-hour time with apm', () => {
        const config: Config = { mask: 'Hh:m0 aa', apm: true, leadZeroDateTime: true };
        check(config, [
            { keys: '1', expected: { value: '1', caret: 1, model: '1' } },
            { keys: '2', expected: { value: '2', caret: 1, model: '2' } },
            { keys: '3', expected: { value: '3', caret: 1, model: '3' } },
            { keys: '9', expected: { value: '9', caret: 1, model: '9' } },
            { keys: '12', expected: { value: '12', caret: 2, model: '12' } },
            // an hour above 12 is padded to 01 and the digit starts the minutes
            { keys: '13', expected: { value: '01:3', caret: 4, model: '013' } },
            { keys: '19', expected: { value: '01:09', caret: 5, model: '0109' } },
            { keys: '10', expected: { value: '10', caret: 2, model: '10' } },
            { keys: '11', expected: { value: '11', caret: 2, model: '11' } },
            // a 12-hour clock has no hour 00: a typed 00 becomes 01 (leadZeroDateTime)
            { keys: '00', expected: { value: '01', caret: 2, model: '01' } },
            { keys: '0', expected: { value: '0', caret: 1, model: '0' } },
            { keys: '01', expected: { value: '01', caret: 2, model: '01' } },
            { keys: '123', expected: { value: '12:3', caret: 4, model: '123' } },
            { keys: '126', expected: { value: '12:06', caret: 5, model: '1206' } },
            { keys: '1259', expected: { value: '12:59', caret: 5, model: '1259' } },
            // by design: the 6 can only be a tens-of-minutes digit, so it is padded (like 3113 in dates)
            { keys: '1260', expected: { value: '12:06 ', caret: 6, model: '1206' } },
            { keys: '125', expected: { value: '12:5', caret: 4, model: '125' } },
            // current behaviour: unsupported token: there is no meridiem pattern, so the letters are never accepted and the value keeps a trailing space
            { keys: '1259a', expected: { value: '12:59 ', caret: 6, model: '1259' } },
            // unsupported token: there is no meridiem pattern, so the letters are never accepted and the value keeps a trailing space
            { keys: '1259am', expected: { value: '12:59 ', caret: 6, model: '1259' } },
            // unsupported token: there is no meridiem pattern, so the letters are never accepted and the value keeps a trailing space
            { keys: '1259pm', expected: { value: '12:59 ', caret: 6, model: '1259' } },
            // unsupported token: there is no meridiem pattern, so the letters are never accepted and the value keeps a trailing space
            { keys: '1259AM', expected: { value: '12:59 ', caret: 6, model: '1259' } },
            // unsupported token: there is no meridiem pattern, so the letters are never accepted and the value keeps a trailing space
            { keys: '1259xx', expected: { value: '12:59 ', caret: 6, model: '1259' } },
            { keys: '0100', expected: { value: '01:00', caret: 5, model: '0100' } },
            { keys: '0030', expected: { value: '01:30', caret: 5, model: '0130' } },
            { keys: '1300', expected: { value: '01:30 ', caret: 6, model: '0130' } },
            // by design: the 9 can only be a tens-of-minutes digit, so it is padded
            { keys: '1299', expected: { value: '12:09 ', caret: 6, model: '1209' } },
            { keys: '1230pm', expected: { value: '12:30 ', caret: 6, model: '1230' } },
            { keys: '1230amx', expected: { value: '12:30 ', caret: 6, model: '1230' } },
        ]);
    });

    describe('Hh:m0 aa editing inside an existing value', () => {
        const config: Config = { mask: 'Hh:m0 aa', apm: true, leadZeroDateTime: true };
        check(config, [
            {
                initial: '1230am',
                edit: { start: 0, end: 0, key: '0' },
                expected: { value: '01:23 ', caret: 1, model: '0123' },
            },
            {
                initial: '1230am',
                edit: { start: 0, end: 0, key: '2' },
                expected: { value: '02:12 ', caret: 4, model: '0212' },
            },
            {
                initial: '1230am',
                edit: { start: 1, end: 1, key: '3' },
                expected: { value: '01:32 ', caret: 4, model: '0132' },
            },
            {
                initial: '1230am',
                edit: { start: 1, end: 1, key: '1' },
                expected: { value: '11:23 ', caret: 2, model: '1123' },
            },
            {
                initial: '1230am',
                edit: { start: 2, end: 2, key: '5' },
                expected: { value: '12:53 ', caret: 4, model: '1253' },
            },
            {
                initial: '1230am',
                edit: { start: 3, end: 3, key: '6' },
                expected: { value: '12:06 ', caret: 6, model: '1206' },
            },
            {
                initial: '1230am',
                edit: { start: 3, end: 3, key: '4' },
                expected: { value: '12:43 ', caret: 4, model: '1243' },
            },
            {
                initial: '1230am',
                edit: { start: 4, end: 4, key: '9' },
                expected: { value: '12:39 ', caret: 5, model: '1239' },
            },
            {
                initial: '1230am',
                edit: { start: 5, end: 5, key: 'p' },
                expected: { value: '12:30 ', caret: 6, model: '1230' },
            },
            {
                initial: '1230am',
                edit: { start: 6, end: 6, key: 'p' },
                expected: { value: '12:30 ', caret: 6, model: '1230' },
            },
            {
                initial: '1230am',
                edit: { start: 7, end: 7, key: 'p' },
                expected: { value: '12:30 ', caret: 6, model: '1230' },
            },
            {
                initial: '1230am',
                edit: { start: 0, end: 2, key: '1' },
                expected: { value: '1:30 ', caret: 1, model: '130' },
            },
            {
                initial: '1230am',
                edit: { start: 0, end: 2, key: '9' },
                expected: { value: '9:30 ', caret: 1, model: '930' },
            },
            {
                initial: '1230am',
                edit: { start: 6, end: 8, key: 'p' },
                expected: { value: '12:30 ', caret: 6, model: '1230' },
            },
        ]);
    });

    describe('Hh:m0 aa Backspace', () => {
        const config: Config = { mask: 'Hh:m0 aa', apm: true, leadZeroDateTime: true };
        check(config, [
            {
                initial: '1230am',
                edit: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '1:30 ', caret: 1, model: '130' },
            },
            {
                initial: '1230am',
                edit: { start: 3, end: 3, key: 'Backspace' },
                expected: { value: '12:30 ', caret: 2, model: '1230' },
            },
            {
                initial: '1230am',
                edit: { start: 5, end: 5, key: 'Backspace' },
                expected: { value: '12:3', caret: 4, model: '123' },
            },
            {
                initial: '1230am',
                edit: { start: 8, end: 8, key: 'Backspace' },
                expected: { value: '12:30', caret: 5, model: '1230' },
            },
            {
                initial: '1230am',
                edit: { start: 1, end: 1, key: 'Backspace' },
                expected: { value: '2:30 ', caret: 0, model: '230' },
            },
            { keys: '1230\b\b', expected: { value: '12:', caret: 3, model: '12' } },
        ]);
    });

    describe('Hh:m0:s0 with apm', () => {
        const config: Config = { mask: 'Hh:m0:s0', apm: true, leadZeroDateTime: true };
        check(config, [
            { keys: '0', expected: { value: '0', caret: 1, model: '0' } },
            // a 12-hour clock has no hour 00: a typed 00 becomes 01 (leadZeroDateTime)
            { keys: '00', expected: { value: '01', caret: 2, model: '01' } },
            { keys: '1', expected: { value: '1', caret: 1, model: '1' } },
            { keys: '10', expected: { value: '10', caret: 2, model: '10' } },
            { keys: '12', expected: { value: '12', caret: 2, model: '12' } },
            { keys: '13', expected: { value: '01:3', caret: 4, model: '013' } },
            { keys: '09', expected: { value: '09', caret: 2, model: '09' } },
            { keys: '123', expected: { value: '12:3', caret: 4, model: '123' } },
            { keys: '1234', expected: { value: '12:34', caret: 5, model: '1234' } },
            { keys: '123456', expected: { value: '12:34:56', caret: 8, model: '123456' } },
            { keys: '236060', expected: { value: '02:36:06', caret: 8, model: '023606' } },
            { paste: '00', expected: { value: '01', caret: 2, model: '01' } },
            // a pasted 00 hour becomes 01 and no digit is lost
            { paste: '00:00:00', expected: { value: '01:00:00', caret: 8, model: '010000' } },
            { paste: '000000', expected: { value: '01:00:00', caret: 8, model: '010000' } },
            { paste: '123456', expected: { value: '12:34:56', caret: 8, model: '123456' } },
            { paste: '13', expected: { value: '01:3', caret: 4, model: '013' } },
            {
                initial: '123456',
                edit: { start: 1, end: 1, key: '9' },
                expected: { value: '01:09:23', caret: 5, model: '010923' },
            },
            {
                initial: '123456',
                edit: { start: 2, end: 2, key: '5' },
                expected: { value: '12:53:45', caret: 4, model: '125345' },
            },
        ]);
    });

    describe('M0/d0 typing a month and day key by key', () => {
        const config: Config = { mask: 'M0/d0', leadZeroDateTime: true };
        check(config, [
            { keys: '0', expected: { value: '0', caret: 1, model: '0' } },
            { keys: '1', expected: { value: '1', caret: 1, model: '1' } },
            { keys: '2', expected: { value: '02', caret: 2, model: '02' } },
            { keys: '3', expected: { value: '03', caret: 2, model: '03' } },
            { keys: '9', expected: { value: '09', caret: 2, model: '09' } },
            { keys: '12', expected: { value: '12', caret: 2, model: '12' } },
            { keys: '13', expected: { value: '01/3', caret: 4, model: '013' } },
            { keys: '19', expected: { value: '01/09', caret: 5, model: '0109' } },
            { keys: '00', expected: { value: '01', caret: 2, model: '01' } },
            { keys: '01', expected: { value: '01', caret: 2, model: '01' } },
            { keys: '123', expected: { value: '12/3', caret: 4, model: '123' } },
            { keys: '124', expected: { value: '12/04', caret: 5, model: '1204' } },
            { keys: '1231', expected: { value: '12/31', caret: 5, model: '1231' } },
            { keys: '1232', expected: { value: '12/03', caret: 5, model: '1203' } },
            { keys: '1235', expected: { value: '12/03', caret: 5, model: '1203' } },
            { keys: '1240', expected: { value: '12/04', caret: 5, model: '1204' } },
            { keys: '1200', expected: { value: '12/01', caret: 5, model: '1201' } },
            { keys: '0230', expected: { value: '02/30', caret: 5, model: '0230' } },
            { keys: '31', expected: { value: '03/1', caret: 4, model: '031' } },
            { keys: '1331', expected: { value: '01/03', caret: 5, model: '0103' } },
            { keys: '12300', expected: { value: '12/30', caret: 5, model: '1230' } },
        ]);
    });

    describe('M0/d0 editing inside an existing value', () => {
        const config: Config = { mask: 'M0/d0', leadZeroDateTime: true };
        check(config, [
            {
                initial: '1231',
                edit: { start: 0, end: 0, key: '0' },
                expected: { value: '02/31', caret: 1, model: '0231' },
            },
            {
                initial: '1231',
                edit: { start: 0, end: 0, key: '2' },
                expected: { value: '02/31', caret: 2, model: '0231' },
            },
            {
                initial: '1231',
                edit: { start: 1, end: 1, key: '3' },
                expected: { value: '03/31', caret: 2, model: '0331' },
            },
            {
                initial: '1231',
                edit: { start: 1, end: 1, key: '1' },
                expected: { value: '11/31', caret: 2, model: '1131' },
            },
            {
                initial: '1231',
                edit: { start: 2, end: 2, key: '1' },
                expected: { value: '12/11', caret: 4, model: '1211' },
            },
            {
                initial: '1231',
                edit: { start: 3, end: 3, key: '4' },
                expected: { value: '12/04', caret: 5, model: '1204' },
            },
            {
                initial: '1231',
                edit: { start: 3, end: 3, key: '2' },
                expected: { value: '12/21', caret: 4, model: '1221' },
            },
            {
                initial: '1231',
                edit: { start: 4, end: 4, key: '5' },
                expected: { value: '12/05', caret: 5, model: '1205' },
            },
            {
                initial: '1231',
                edit: { start: 4, end: 4, key: '0' },
                expected: { value: '12/30', caret: 5, model: '1230' },
            },
            {
                initial: '1231',
                edit: { start: 5, end: 5, key: '5' },
                expected: { value: '12/31', caret: 5, model: '1231' },
            },
            {
                initial: '1231',
                edit: { start: 0, end: 2, key: '4' },
                expected: { value: '04/31', caret: 2, model: '0431' },
            },
            {
                initial: '1231',
                edit: { start: 3, end: 5, key: '4' },
                expected: { value: '12/04', caret: 5, model: '1204' },
            },
            {
                initial: '1231',
                edit: { start: 3, end: 5, key: '2' },
                expected: { value: '12/20', caret: 4, model: '1220' },
            },
        ]);
    });

    describe('hh:m0 lone hour token', () => {
        const config: Config = { mask: 'hh:m0', leadZeroDateTime: true };
        check(config, [
            { keys: '1', expected: { value: '1', caret: 1, model: '1' } },
            { keys: '2', expected: { value: '2', caret: 1, model: '2' } },
            { keys: '3', expected: { value: '3', caret: 1, model: '3' } },
            { keys: '13', expected: { value: '13', caret: 2, model: '13' } },
            { keys: '23', expected: { value: '23', caret: 2, model: '23' } },
            { keys: '24', expected: { value: '02:4', caret: 4, model: '024' } },
            { keys: '25', expected: { value: '02:5', caret: 4, model: '025' } },
            { keys: '2359', expected: { value: '23:59', caret: 5, model: '2359' } },
            {
                initial: '1234',
                edit: { start: 1, end: 1, key: '5' },
                expected: { value: '15:23', caret: 2, model: '1523' },
            },
        ]);
    });

    describe('hh:m0 lone hour token with apm', () => {
        const config: Config = { mask: 'hh:m0', apm: true, leadZeroDateTime: true };
        check(config, [
            { keys: '1', expected: { value: '1', caret: 1, model: '1' } },
            { keys: '12', expected: { value: '12', caret: 2, model: '12' } },
            { keys: '13', expected: { value: '01:3', caret: 4, model: '013' } },
            { keys: '19', expected: { value: '01:09', caret: 5, model: '0109' } },
            { keys: '1259', expected: { value: '12:59', caret: 5, model: '1259' } },
            {
                initial: '1234',
                edit: { start: 1, end: 1, key: '5' },
                expected: { value: '01:52', caret: 4, model: '0152' },
            },
        ]);
    });

    describe('M0/d0 Backspace and Delete', () => {
        const config: Config = { mask: 'M0/d0', leadZeroDateTime: true };
        check(config, [
            // deleting the second month digit pads the month instead of leaving month 13
            {
                initial: '1231',
                edit: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '01/31', caret: 1, model: '0131' },
            },
            {
                initial: '1231',
                edit: { start: 3, end: 3, key: 'Backspace' },
                expected: { value: '12/31', caret: 2, model: '1231' },
            },
            {
                initial: '1231',
                edit: { start: 5, end: 5, key: 'Backspace' },
                expected: { value: '12/3', caret: 4, model: '123' },
            },
            {
                initial: '1231',
                edit: { start: 1, end: 1, key: 'Backspace' },
                expected: { value: '02/31', caret: 0, model: '0231' },
            },
            {
                initial: '1231',
                edit: { start: 2, end: 2, key: 'Delete' },
                expected: { value: '12/31', caret: 3, model: '1231' },
            },
            {
                initial: '1231',
                edit: { start: 0, end: 0, key: 'Delete' },
                expected: { value: '02/31', caret: 0, model: '0231' },
            },
            { keys: '1231\b\b', expected: { value: '12/', caret: 3, model: '12' } },
        ]);
    });

    describe('out-of-range months, hours and 00 fields (PR1 fixes)', () => {
        section('0000-M0-d0 month above 12', { mask: '0000-M0-d0', leadZeroDateTime: true }, [
            { keys: '202013', expected: { value: '2020-01-3', caret: 9, model: '2020013' } },
            { keys: '202014', expected: { value: '2020-01-04', caret: 10, model: '20200104' } },
            { keys: '202012', expected: { value: '2020-12', caret: 7, model: '202012' } },
            // a digit over the whole selected month zero-fills (`1` -> `10`), the day is kept
            {
                initial: '20201231',
                edit: { start: 5, end: 7, key: '1' },
                expected: { value: '2020-10-31', caret: 6, model: '20201031' },
            },
            {
                initial: '20201231',
                edit: { start: 7, end: 7, key: 'Backspace' },
                expected: { value: '2020-01-31', caret: 6, model: '20200131' },
            },
        ]);

        section('0000M0d0 month above 12', { mask: '0000M0d0', leadZeroDateTime: true }, [
            { keys: '202013', expected: { value: '2020013', caret: 7, model: '2020013' } },
            {
                initial: '20201231',
                edit: { start: 4, end: 6, key: '1' },
                expected: { value: '20201031', caret: 5, model: '20201031' },
            },
            {
                initial: '20201231',
                edit: { start: 6, end: 6, key: 'Backspace' },
                expected: { value: '20200131', caret: 7, model: '20200131' },
            },
        ]);

        section('0000.M0.d0 month above 12', { mask: '0000.M0.d0', leadZeroDateTime: true }, [
            { paste: '20201315', expected: { value: '2020.01.31', caret: 10, model: '20200131' } },
            {
                initial: '20201315',
                expected: { value: '2020.01.31', caret: 10, model: '20200131' },
            },
            { paste: '20201215', expected: { value: '2020.12.15', caret: 10, model: '20201215' } },
            {
                initial: '20201231',
                edit: { start: 7, end: 7, key: 'Backspace' },
                expected: { value: '2020.01.31', caret: 6, model: '20200131' },
            },
            // a digit shifted left by a year Backspace stays unpadded and is re-split (same as the parent)
            {
                initial: '20201231',
                edit: { start: 4, end: 4, key: 'Backspace' },
                expected: { value: '2021.02.31', caret: 3, model: '20210231' },
            },
            // a separator typed after a lone month digit pads it, as in d0/M0/0000
            { keys: '20201.', expected: { value: '2020.01.', caret: 7, model: '202001' } },
        ]);

        section('Hh:m0:s0 hours above 23', { mask: 'Hh:m0:s0', leadZeroDateTime: true }, [
            { paste: '246060', expected: { value: '02:46:06', caret: 8, model: '024606' } },
            { initial: '246060', expected: { value: '02:46:06', caret: 8, model: '024606' } },
            { keys: '2359', expected: { value: '23:59', caret: 5, model: '2359' } },
        ]);

        section('Hh:m0:s0 hour 24 without leadZeroDateTime', { mask: 'Hh:m0:s0' }, [
            { keys: '24', expected: { value: '2:4', caret: 3, model: '24' } },
        ]);

        section(
            'Hh:m0:s0 apm hours above 12',
            { mask: 'Hh:m0:s0', apm: true, leadZeroDateTime: true },
            [
                { keys: '19', expected: { value: '01:09', caret: 5, model: '0109' } },
                { keys: '1300', expected: { value: '01:30:0', caret: 7, model: '01300' } },
                { keys: '1259', expected: { value: '12:59', caret: 5, model: '1259' } },
                // a first hour digit of 3 to 9 is padded and kept as the hour's second digit
                { keys: '930', expected: { value: '09:30', caret: 5, model: '0930' } },
                { keys: '815', expected: { value: '08:15', caret: 5, model: '0815' } },
                { keys: '45', expected: { value: '04:5', caret: 4, model: '045' } },
                { keys: '31', expected: { value: '03:1', caret: 4, model: '031' } },
                { keys: '99', expected: { value: '09:09', caret: 5, model: '0909' } },
                { keys: '930415', expected: { value: '09:30:41', caret: 8, model: '093041' } },
            ]
        );

        // every first hour digit 0-9, typed key by key, pasted and written: [digit, value] for `<digit>15`
        const firstHourDigits: [string, string][] = [
            ['0', '01:5'],
            ['1', '11:5'],
            ['2', '02:15'],
            ['3', '03:15'],
            ['4', '04:15'],
            ['5', '05:15'],
            ['6', '06:15'],
            ['7', '07:15'],
            ['8', '08:15'],
            ['9', '09:15'],
        ];
        for (const [title, mask] of [
            ['Hh:m0:s0', 'Hh:m0:s0'],
            ['Hh:m0', 'Hh:m0'],
            ['hh:m0', 'hh:m0'],
        ]) {
            section(
                `${title} apm first hour digits 0-9`,
                { mask: mask as string, apm: true, leadZeroDateTime: true },
                firstHourDigits.flatMap(([digit, value]) => {
                    const expected = {
                        value,
                        caret: value.length,
                        model: value.replace(':', ''),
                    };
                    return [
                        { keys: `${digit}15`, expected },
                        { paste: `${digit}15`, expected },
                        { initial: `${digit}15`, expected },
                    ];
                })
            );
        }

        section('Hh:m0 apm 930 and 815', { mask: 'Hh:m0', apm: true, leadZeroDateTime: true }, [
            { keys: '930', expected: { value: '09:30', caret: 5, model: '0930' } },
            { keys: '815', expected: { value: '08:15', caret: 5, model: '0815' } },
        ]);

        section('hh:m0 apm 930', { mask: 'hh:m0', apm: true, leadZeroDateTime: true }, [
            { keys: '930', expected: { value: '09:30', caret: 5, model: '0930' } },
        ]);

        section('Hh:m0:s0 apm without leadZeroDateTime', { mask: 'Hh:m0:s0', apm: true }, [
            { keys: '13', expected: { value: '1:3', caret: 3, model: '13' } },
            { keys: '93', expected: { value: '9:3', caret: 3, model: '93' } },
        ]);

        // a digit inserted at the hour's tens or units of a complete 12-hour value
        section(
            'Hh:m0 apm a digit typed into 12:30',
            { mask: 'Hh:m0', apm: true, leadZeroDateTime: true },
            [
                ...(
                    [
                        ['0', '01:23', 1],
                        ['1', '11:23', 1],
                        ['2', '02:12', 4],
                        ['3', '03:12', 4],
                        ['4', '04:12', 4],
                        ['5', '05:12', 4],
                        ['6', '06:12', 4],
                        ['7', '07:12', 4],
                        ['8', '08:12', 4],
                        ['9', '09:12', 4],
                    ] as const
                ).map(([key, value, caret]) => ({
                    initial: '1230',
                    edit: { start: 0, end: 0, key },
                    expected: { value, caret, model: value.replace(':', '') },
                })),
                ...(
                    [
                        ['0', '10:23', 2],
                        ['1', '11:23', 2],
                        ['2', '12:23', 2],
                        ['3', '01:32', 4],
                        ['6', '01:06', 5],
                        ['9', '01:09', 5],
                    ] as const
                ).map(([key, value, caret]) => ({
                    initial: '1230',
                    edit: { start: 1, end: 1, key },
                    expected: { value, caret, model: value.replace(':', '') },
                })),
            ]
        );

        section(
            'd0/M0/0000 Hh:m0:s0 hours',
            { mask: 'd0/M0/0000 Hh:m0:s0', leadZeroDateTime: true },
            [
                {
                    keys: '1112202324',
                    expected: { value: '11/12/2023 02:4', caret: 15, model: '11122023024' },
                },
            ]
        );

        section(
            'd0/M0/0000 Hh:m0:s0 apm hours',
            { mask: 'd0/M0/0000 Hh:m0:s0', apm: true, leadZeroDateTime: true },
            [
                {
                    keys: '15062020930',
                    expected: { value: '15/06/2020 09:30', caret: 16, model: '150620200930' },
                },
                {
                    keys: '15062020815',
                    expected: { value: '15/06/2020 08:15', caret: 16, model: '150620200815' },
                },
                {
                    keys: '150620201230',
                    expected: { value: '15/06/2020 12:30', caret: 16, model: '150620201230' },
                },
            ]
        );

        section('d0/M0/0000 typed and pasted 00', { mask: 'd0/M0/0000', leadZeroDateTime: true }, [
            { paste: '00062020', expected: { value: '01/06/2020', caret: 10, model: '01062020' } },
            { paste: '15002020', expected: { value: '15/01/2020', caret: 10, model: '15012020' } },
            { paste: '00002020', expected: { value: '01/01/2020', caret: 10, model: '01012020' } },
            // programmatic writes round-trip unchanged: 00 is a stored "unknown" convention
            {
                initial: '00062020',
                expected: { value: '00/06/2020', caret: 10, model: '00062020' },
            },
            {
                initial: '15002020',
                expected: { value: '15/00/2020', caret: 10, model: '15002020' },
            },
            {
                initial: '15062020',
                edit: { start: 5, end: 5, key: 'Backspace' },
                expected: { value: '15/01/2020', caret: 4, model: '15012020' },
            },
            {
                initial: '15062020',
                edit: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '01/06/2020', caret: 1, model: '01062020' },
            },
            // an edit that touches a written 00 field clamps it, as typing 00 does
            {
                initial: '00062020',
                edit: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '01/06/2020', caret: 1, model: '01062020' },
            },
        ]);

        section(
            'd0/M0/0000 an edit in another field leaves a written 00 alone',
            { mask: 'd0/M0/0000', leadZeroDateTime: true },
            [
                {
                    initial: '00062020',
                    edit: { start: 10, end: 10, key: 'Backspace' },
                    expected: { value: '00/06/202', caret: 9, model: '0006202' },
                },
                {
                    initial: '15002020',
                    edit: { start: 10, end: 10, key: 'Backspace' },
                    expected: { value: '15/00/202', caret: 9, model: '1500202' },
                },
                {
                    initial: '00062020',
                    edit: { start: 9, end: 9, key: '7' },
                    expected: { value: '00/06/2027', caret: 10, model: '00062027' },
                },
                {
                    initial: '00062020',
                    edit: { start: 10, end: 10, key: '7' },
                    expected: { value: '00/06/2020', caret: 10, model: '00062020' },
                },
                {
                    initial: '15002020',
                    edit: { start: 9, end: 9, key: '7' },
                    expected: { value: '15/00/2027', caret: 10, model: '15002027' },
                },
                // a deletion starting on the separator after a written 00 leaves the 00 alone
                {
                    initial: '00062020',
                    edit: { start: 3, end: 3, key: 'Backspace' },
                    expected: { value: '00/06/2020', caret: 2, model: '00062020' },
                },
                {
                    initial: '00062020',
                    edit: { start: 2, end: 2, key: 'Delete' },
                    expected: { value: '00/06/2020', caret: 3, model: '00062020' },
                },
                {
                    initial: '15002020',
                    edit: { start: 6, end: 6, key: 'Backspace' },
                    expected: { value: '15/00/2020', caret: 5, model: '15002020' },
                },
                {
                    initial: '15002020',
                    edit: { start: 5, end: 5, key: 'Delete' },
                    expected: { value: '15/00/2020', caret: 6, model: '15002020' },
                },
                // a deletion of the year digit after a written 00 leaves the 00 alone too
                {
                    initial: '15002020',
                    edit: { start: 6, end: 6, key: 'Delete' },
                    expected: { value: '15/00/020', caret: 6, model: '1500020' },
                },
            ]
        );

        section('d0/M0/0000 without leadZeroDateTime', { mask: 'd0/M0/0000' }, [
            { keys: '00', expected: { value: '00', caret: 2, model: '00' } },
            { keys: '1500', expected: { value: '15/00', caret: 5, model: '1500' } },
            {
                initial: '15002020',
                expected: { value: '15/00/2020', caret: 10, model: '15002020' },
            },
        ]);

        section('M0/d0 typed and pasted 00', { mask: 'M0/d0', leadZeroDateTime: true }, [
            { paste: '0100', expected: { value: '01/01', caret: 5, model: '0101' } },
            { initial: '0100', expected: { value: '01/00', caret: 5, model: '0100' } },
            // Feb 30 needs the year: the mask does not validate it (use the validation input)
            { keys: '0230', expected: { value: '02/30', caret: 5, model: '0230' } },
        ]);

        section('M0/d0/0000 Backspace', { mask: 'M0/d0/0000', leadZeroDateTime: true }, [
            {
                initial: '12312020',
                edit: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '01/31/2020', caret: 1, model: '01312020' },
            },
        ]);

        // without leadZeroDateTime the month keeps its non-padded behaviour (the parent's `13/1`)
        section('M0/d0 Backspace without leadZeroDateTime', { mask: 'M0/d0' }, [
            {
                initial: '1231',
                edit: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '13/1', caret: 1, model: '131' },
            },
        ]);

        section(
            'M0/d0/0000 showMaskTyped Backspace and Delete without leadZeroDateTime',
            {
                mask: 'M0/d0/0000',
                showMaskTyped: true,
            },
            [
                {
                    initial: '1231',
                    edit: { start: 2, end: 2, key: 'Backspace' },
                    expected: { value: '13/1_/____', caret: 1, model: '131' },
                },
                {
                    initial: '1231',
                    edit: { start: 1, end: 1, key: 'Delete' },
                    expected: { value: '13/1_/____', caret: 1, model: '131' },
                },
                {
                    initial: '1231',
                    edit: { start: 0, end: 0, key: 'Delete' },
                    expected: { value: '23/1_/____', caret: 0, model: '231' },
                },
                {
                    initial: '12312020',
                    edit: { start: 2, end: 2, key: 'Backspace' },
                    expected: { value: '13/12/020_', caret: 1, model: '1312020' },
                },
            ]
        );

        section(
            'M0/d0/0000 showMaskTyped Backspace with leadZeroDateTime',
            {
                mask: 'M0/d0/0000',
                showMaskTyped: true,
                leadZeroDateTime: true,
            },
            [
                {
                    initial: '1231',
                    edit: { start: 2, end: 2, key: 'Backspace' },
                    expected: { value: '01/31/____', caret: 1, model: '0131' },
                },
                {
                    initial: '12312020',
                    edit: { start: 2, end: 2, key: 'Backspace' },
                    expected: { value: '01/31/2020', caret: 1, model: '01312020' },
                },
            ]
        );

        // keepCharacterPositions rejects a pasted day or month out of range (#1748); a typed 00 is
        // not guarded here (Item 15)
        section(
            'd0/M0/0000 keepCharacterPositions',
            {
                mask: 'd0/M0/0000',
                leadZeroDateTime: true,
                keepCharacterPositions: true,
            },
            [
                { paste: '00062020', expected: { value: '', caret: 0, model: null } },
                { paste: '15002020', expected: { value: '', caret: 0, model: null } },
                { keys: '00', expected: { value: '00', caret: 2, model: '00' } },
                { keys: '0006', expected: { value: '00/06', caret: 5, model: '0006' } },
            ]
        );

        section(
            'd0/M0/0000 keepCharacterPositions showMaskTyped',
            {
                mask: 'd0/M0/0000',
                leadZeroDateTime: true,
                keepCharacterPositions: true,
                showMaskTyped: true,
            },
            [
                { paste: '00062020', expected: { value: '__/__/____', caret: 0, model: '' } },
                // #1724: a second 0 would make the day 00, so the key is rejected
                { keys: '00', expected: { value: '0_/__/____', caret: 1, model: '0' } },
                // the caret stays at the end of the skeleton, as after focusing the empty field
                { keys: '12', expected: { value: '12/__/____', caret: 2, model: '12' } },
            ]
        );

        section(
            'Backspace through a showMaskTyped date',
            {
                mask: 'M0-d0-0000',
                leadZeroDateTime: true,
                showMaskTyped: true,
            },
            [
                // a lone month digit before placeholders is not padded: the date empties out
                {
                    keys: '12310000' + '\b'.repeat(10),
                    expected: { value: '__-__-____', caret: 0, model: '' },
                },
            ]
        );

        section('M0/d0 Backspace after typing', { mask: 'M0/d0', leadZeroDateTime: true }, [
            { keys: '12\b', expected: { value: '1', caret: 1, model: '1' } },
            { keys: '12/\b\b', expected: { value: '1', caret: 1, model: '1' } },
        ]);

        section('Hh:m0:s0 apm hour 00', { mask: 'Hh:m0:s0', apm: true, leadZeroDateTime: true }, [
            { keys: '000000', expected: { value: '01:00:00', caret: 8, model: '010000' } },
            // a programmatic write keeps its 00
            { initial: '000000', expected: { value: '00:00:00', caret: 8, model: '000000' } },
            { keys: '0130', expected: { value: '01:30', caret: 5, model: '0130' } },
            // an edit elsewhere leaves a written 00 hour alone
            {
                initial: '000000',
                edit: { start: 8, end: 8, key: 'Backspace' },
                expected: { value: '00:00:0', caret: 7, model: '00000' },
            },
            {
                initial: '000000',
                edit: { start: 8, end: 8, key: '5' },
                expected: { value: '00:00:00', caret: 8, model: '000000' },
            },
        ]);

        section('Hh:m0:s0 apm hour 00 without leadZeroDateTime', { mask: 'Hh:m0:s0', apm: true }, [
            { keys: '00', expected: { value: '00', caret: 2, model: '00' } },
            { keys: '000000', expected: { value: '00:00:00', caret: 8, model: '000000' } },
        ]);

        section('Hh:m0 aa apm hour 00', { mask: 'Hh:m0 aa', apm: true, leadZeroDateTime: true }, [
            { paste: '0030', expected: { value: '01:30', caret: 5, model: '0130' } },
        ]);

        section('hh:m0 apm hour 00', { mask: 'hh:m0', apm: true, leadZeroDateTime: true }, [
            { keys: '00', expected: { value: '01', caret: 2, model: '01' } },
            { keys: '0030', expected: { value: '01:30', caret: 5, model: '0130' } },
            { paste: '0030', expected: { value: '01:30', caret: 5, model: '0130' } },
            { paste: '00:30', expected: { value: '01:30', caret: 5, model: '0130' } },
            // a programmatic write keeps its 00, and an edit elsewhere leaves it alone
            { initial: '0030', expected: { value: '00:30', caret: 5, model: '0030' } },
            {
                initial: '0030',
                edit: { start: 5, end: 5, key: 'Backspace' },
                expected: { value: '00:3', caret: 4, model: '003' },
            },
        ]);

        section('hh:m0 hour 00 without apm', { mask: 'hh:m0', leadZeroDateTime: true }, [
            { keys: '0030', expected: { value: '00:30', caret: 5, model: '0030' } },
        ]);
    });

    // A digit typed into a complete date overwrites the next digit slot (the date never shifts); see overwriteDateSlot.
    describe('overwrite instead of shifting in a complete date', () => {
        section(
            'd0/M0/0000 a digit typed into a complete date overwrites the next digit',
            { mask: 'd0/M0/0000', leadZeroDateTime: true },
            [
                {
                    initial: '15062020',
                    edit: { start: 2, end: 2, key: '1' },
                    expected: { value: '15/10/2020', caret: 4, model: '15102020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 3, end: 3, key: '9' },
                    expected: { value: '15/09/2020', caret: 5, model: '15092020' },
                },
                // a rejected key leaves the date, the caret and the model as they were
                {
                    initial: '15062020',
                    edit: { start: 1, end: 1, key: 'a' },
                    expected: { value: '15/06/2020', caret: 1, model: '15062020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 2, end: 2, key: '/' },
                    expected: { value: '15/06/2020', caret: 2, model: '15062020' },
                },
                // a digit typed over a whole selected field zero-fills the same way: a tens digit
                // keeps its slot (caret after it), any other digit is the whole field
                {
                    initial: '15062020',
                    edit: { start: 0, end: 2, key: '3' },
                    expected: { value: '30/06/2020', caret: 1, model: '30062020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 0, end: 2, key: '4' },
                    expected: { value: '04/06/2020', caret: 2, model: '04062020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 3, end: 5, key: '1' },
                    expected: { value: '15/10/2020', caret: 4, model: '15102020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 3, end: 5, key: '4' },
                    expected: { value: '15/04/2020', caret: 5, model: '15042020' },
                },
                // the 00 the zero-fill makes becomes 01
                {
                    initial: '15062020',
                    edit: { start: 3, end: 5, key: '0' },
                    expected: { value: '15/01/2020', caret: 4, model: '15012020' },
                },
                {
                    initial: '31122020',
                    edit: { start: 2, end: 2, key: '0' },
                    expected: { value: '31/02/2020', caret: 4, model: '31022020' },
                },
                // the 0 lands past the separator, next to the 0 that follows: the edit spans both
                {
                    initial: '15102020',
                    edit: { start: 2, end: 2, key: '0' },
                    expected: { value: '15/01/2020', caret: 4, model: '15012020' },
                },
                // a written 00 stays when a rejected key touches it
                {
                    initial: '00062020',
                    edit: { start: 1, end: 1, key: 'a' },
                    expected: { value: '00/06/2020', caret: 1, model: '00062020' },
                },
            ]
        );

        section(
            'd0/M0/0000 showMaskTyped overwrites in a complete date',
            { mask: 'd0/M0/0000', leadZeroDateTime: true, showMaskTyped: true },
            [
                {
                    initial: '1506',
                    edit: { start: 3, end: 3, key: '9' },
                    expected: { value: '15/09/____', caret: 5, model: '1509' },
                },
                {
                    initial: '15062020',
                    edit: { start: 0, end: 0, key: '4' },
                    expected: { value: '04/06/2020', caret: 2, model: '04062020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 0, end: 0, key: '3' },
                    expected: { value: '30/06/2020', caret: 1, model: '30062020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 3, end: 5, key: '1' },
                    expected: { value: '15/10/2020', caret: 4, model: '15102020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 1, end: 1, key: 'a' },
                    expected: { value: '15/06/2020', caret: 1, model: '15062020' },
                },
            ]
        );

        section(
            'd0/M0/0000 Hh:m0:s0 overwrites the time half of a complete value',
            { mask: 'd0/M0/0000 Hh:m0:s0', leadZeroDateTime: true },
            [
                {
                    initial: '15062020123045',
                    edit: { start: 0, end: 0, key: '4' },
                    expected: { value: '04/06/2020 12:30:45', caret: 2, model: '04062020123045' },
                },
                {
                    initial: '15062020123045',
                    edit: { start: 11, end: 11, key: '9' },
                    expected: { value: '15/06/2020 09:30:45', caret: 13, model: '15062020093045' },
                },
                {
                    initial: '15062020123045',
                    edit: { start: 11, end: 11, key: '2' },
                    expected: { value: '15/06/2020 22:30:45', caret: 12, model: '15062020223045' },
                },
                {
                    initial: '15062020123045',
                    edit: { start: 14, end: 14, key: '7' },
                    expected: { value: '15/06/2020 12:07:45', caret: 16, model: '15062020120745' },
                },
            ]
        );

        section(
            'd0/M0/0000 Hh:m0:s0 with apm overwrites the hour up to 12',
            { mask: 'd0/M0/0000 Hh:m0:s0', leadZeroDateTime: true, apm: true },
            [
                {
                    initial: '15062020123045',
                    edit: { start: 11, end: 11, key: '2' },
                    expected: { value: '15/06/2020 02:30:45', caret: 13, model: '15062020023045' },
                },
                {
                    initial: '15062020123045',
                    edit: { start: 11, end: 11, key: '1' },
                    expected: { value: '15/06/2020 12:30:45', caret: 12, model: '15062020123045' },
                },
                {
                    initial: '15062020123045',
                    edit: { start: 12, end: 12, key: '3' },
                    expected: { value: '15/06/2020 03:30:45', caret: 13, model: '15062020033045' },
                },
            ]
        );

        section(
            '0000.M0.d0 overwrites in a complete date',
            { mask: '0000.M0.d0', leadZeroDateTime: true },
            [
                // a month digit that would pass 12 is padded, the day and the year stay
                {
                    initial: '20201231',
                    edit: { start: 6, end: 6, key: '3' },
                    expected: { value: '2020.03.31', caret: 7, model: '20200331' },
                },
                {
                    initial: '20201231',
                    edit: { start: 6, end: 6, key: '4' },
                    expected: { value: '2020.04.31', caret: 7, model: '20200431' },
                },
            ]
        );

        section(
            '0000M0d0 overwrites across a field boundary',
            { mask: '0000M0d0', leadZeroDateTime: true },
            [
                {
                    initial: '20201231',
                    edit: { start: 4, end: 4, key: '4' },
                    expected: { value: '20200431', caret: 6, model: '20200431' },
                },
                {
                    initial: '20201231',
                    edit: { start: 5, end: 5, key: '3' },
                    expected: { value: '20200331', caret: 6, model: '20200331' },
                },
            ]
        );

        section('M0/d0 overwrites in a complete value', { mask: 'M0/d0', leadZeroDateTime: true }, [
            {
                initial: '1231',
                edit: { start: 0, end: 0, key: '2' },
                expected: { value: '02/31', caret: 2, model: '0231' },
            },
            {
                initial: '1231',
                edit: { start: 1, end: 1, key: '3' },
                expected: { value: '03/31', caret: 2, model: '0331' },
            },
            {
                initial: '1231',
                edit: { start: 2, end: 2, key: '1' },
                expected: { value: '12/11', caret: 4, model: '1211' },
            },
        ]);

        section(
            'd0/M0/0000 keepCharacterPositions keeps its own slot rules',
            {
                mask: 'd0/M0/0000',
                leadZeroDateTime: true,
                keepCharacterPositions: true,
                showMaskTyped: true,
            },
            [
                // kcp writes the digit into its slot, and rejects one that puts the field out of range
                // (#1724): 3 over the 1 of 15 would make the day 35
                {
                    initial: '15062020',
                    edit: { start: 0, end: 0, key: '3' },
                    expected: { value: '15/06/2020', caret: 0, model: '15062020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 0, end: 0, key: '2' },
                    expected: { value: '25/06/2020', caret: 1, model: '25062020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 4, end: 4, key: '3' },
                    expected: { value: '15/03/2020', caret: 5, model: '15032020' },
                },
                {
                    initial: '15062020',
                    edit: { start: 3, end: 3, key: '1' },
                    expected: { value: '15/06/2020', caret: 3, model: '15062020' },
                },
            ]
        );

        // A prefix or suffix mask keeps the parent's d0/M0/0000 overwrite (overwriteFullDateValue): the
        // character after the typed one is dropped and the rest goes through regular masking, so an
        // out-of-range pair still shifts the digits.
        section(
            'd0/M0/0000 with a prefix keeps the parent overwrite',
            { mask: 'd0/M0/0000', leadZeroDateTime: true, prefix: '+ ' },
            [
                {
                    initial: '15062020',
                    edit: { start: 2, end: 2, key: '3' },
                    expected: { value: '+ 03/05/0620', caret: 4, model: '03050620' },
                },
                {
                    initial: '15062020',
                    edit: { start: 5, end: 5, key: '3' },
                    expected: { value: '+ 15/03/6202', caret: 7, model: '15036202' },
                },
            ]
        );

        section(
            'd0/M0/0000 with a suffix keeps the parent overwrite',
            { mask: 'd0/M0/0000', leadZeroDateTime: true, suffix: ' x' },
            [
                {
                    initial: '15062020',
                    edit: { start: 0, end: 0, key: '3' },
                    expected: { value: '03/05/0620 x', caret: 5, model: '03050620' },
                },
            ]
        );

        // Without leadZeroDateTime a field is repaired without padding (#1713); an edit
        // overwriteDateSlot still declines (a lone 0, a selection beyond one field) keeps the
        // parent's d0/M0/0000 overwrite, which drops the character after the typed one.
        section(
            'd0/M0/0000 without leadZeroDateTime overwrites a field that stays in range',
            { mask: 'd0/M0/0000' },
            [
                {
                    initial: '15062020',
                    edit: { start: 1, end: 1, key: '9' },
                    expected: { value: '19/06/2020', caret: 2, model: '19062020' },
                },
                // #1713: 4 over the 1 of 15 is the day 45, so it replaces the day and the year stays
                {
                    initial: '15062020',
                    edit: { start: 0, end: 0, key: '4' },
                    expected: { value: '4/06/2020', caret: 1, model: '4062020' },
                },
                // current behaviour: the parent overwrite drops the separator after the lone 0, a year digit flows into the month
                {
                    initial: '15062020',
                    edit: { start: 3, end: 5, key: '0' },
                    expected: { value: '15/02/020', caret: 4, model: '1502020' },
                },
            ]
        );

        // A hiddenInput display conceals the day and the month (`**/**/2020`), the year stays
        // visible: the concealed day keeps the parent overwrite, a year edit applies to the model.
        section(
            'd0/M0/0000 hiddenInput keeps the parent overwrite',
            { mask: 'd0/M0/0000', leadZeroDateTime: true, hiddenInput: true },
            [
                // current behaviour: the digit typed over the concealed day is dropped
                {
                    initial: '15062020',
                    edit: { start: 0, end: 0, key: '4' },
                    expected: { value: '**/**/2020', caret: 4, model: '15062020' },
                },
                // the visible year is edited for real: the last digit is overwritten
                {
                    initial: '15062020',
                    edit: { start: 9, end: 9, key: '7' },
                    expected: { value: '**/**/2027', caret: 10, model: '15062027' },
                },
            ]
        );

        describe('edits without a keydown, pastes and re-renders', () => {
            /**
             * Splices `text` over `start`-`end` and fires `input` with no keydown before it, as
             * dictation or an insertText does; `paste` fires the paste event first.
             */
            async function input(
                harness: CharacterizationHarness,
                start: number,
                end: number,
                text: string,
                paste = false
            ): Promise<EditSnapshot> {
                const { el } = harness;
                const debugElement = harness.fixture.debugElement.query(By.css('input'));
                if (paste) {
                    debugElement.triggerEventHandler('paste', {});
                }
                el.value = el.value.slice(0, start) + text + el.value.slice(end);
                el.setSelectionRange(start + text.length, start + text.length);
                debugElement.triggerEventHandler('input', { target: el });
                await harness.settle();
                return harness.snapshot();
            }

            async function dateHarness(initial: string): Promise<CharacterizationHarness> {
                const harness = createHarness();
                harness.component.mask.set('d0/M0/0000');
                harness.component.leadZeroDateTime.set(true);
                await harness.settle();
                await harness.write(initial);
                return harness;
            }

            const pick = ({ value, caret, model }: EditSnapshot) => ({ value, caret, model });

            // the keydown that would record the display never fired: the written raw value is all there is
            it('overwrites a digit typed without a keydown', async () => {
                const harness = await dateHarness('15062020');
                expect(pick(await input(harness, 1, 1, '9'))).toEqual({
                    value: '19/06/2020',
                    caret: 2,
                    model: '19062020',
                });
                expect(pick(await input(harness, 0, 0, '3'))).toEqual({
                    value: '30/06/2020',
                    caret: 1,
                    model: '30062020',
                });
                expect(pick(await input(harness, 3, 3, '4'))).toEqual({
                    value: '30/04/2020',
                    caret: 5,
                    model: '30042020',
                });
            });

            // current behaviour: a selection needs the keydown's display, so without one it keeps the parent overwrite
            it('keeps the parent overwrite for a selection replaced without a keydown', async () => {
                const harness = await dateHarness('15062020');
                expect(pick(await input(harness, 3, 5, '1'))).toEqual({
                    value: '15/12/020',
                    caret: 4,
                    model: '1512020',
                });
            });

            it('replaces a selection without a keydown after an overwrite', async () => {
                const harness = await dateHarness('15062020');
                await harness.edit({ start: 2, end: 2, key: '1' });
                expect(pick(await input(harness, 0, 2, '3'))).toEqual({
                    value: '30/10/2020',
                    caret: 1,
                    model: '30102020',
                });
            });

            // current behaviour: a paste keeps the parent overwrite, which shifts an out-of-range day;
            // the caret sits after the pasted character and the 0 the mask prepended to it (#1703)
            it('keeps the parent overwrite for a paste', async () => {
                const harness = await dateHarness('15062020');
                expect(pick(await input(harness, 0, 0, '4', true))).toEqual({
                    value: '04/05/0620',
                    caret: 2,
                    model: '04050620',
                });
            });

            it('re-renders the overwritten date when an input changes', async () => {
                const harness = await dateHarness('15062020');
                await harness.edit({ start: 0, end: 0, key: '4' });
                harness.component.validation.set(false);
                await harness.settle();
                expect(pick(harness.snapshot())).toEqual({
                    value: '04/06/2020',
                    caret: 2,
                    model: '04062020',
                });
            });
        });
    });
    describe('date edits next to the caret, selection and prefix', () => {
        // #1713: typing into a whole selected field or at the start of a full date without
        // leadZeroDateTime replaced the field and shifted the digits of the year
        section('d0/M0/0000 without leadZeroDateTime (#1713)', { mask: 'd0/M0/0000' }, [
            {
                initial: '15062020',
                edit: { start: 0, end: 2, key: '3' },
                expected: { value: '30/06/2020', caret: 1, model: '30062020' },
            },
            {
                initial: '15062020',
                edit: { start: 0, end: 2, key: '4' },
                expected: { value: '4/06/2020', caret: 1, model: '4062020' },
            },
            {
                initial: '15062020',
                edit: { start: 3, end: 5, key: '5' },
                expected: { value: '15/5/2020', caret: 4, model: '1552020' },
            },
        ]);

        // #1721: Delete over a prefixed date removes the selection only, as without the prefix
        section('d0/M0/0000 Delete with a prefix (#1721)', { mask: 'd0/M0/0000', prefix: '+7 ' }, [
            {
                initial: '15062020',
                edit: { start: 3, end: 4, key: 'Delete' },
                expected: { value: '+7 5/06/2020', caret: 3, model: '5062020' },
            },
        ]);
    });
});
