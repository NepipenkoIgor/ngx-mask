import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EditAction, EditSnapshot } from './utils/characterization-harness';
import { createHarness } from './utils/characterization-harness';
import { pasteTest } from './utils/test-functions.component';
import type { TestMaskComponent } from './utils/test-component.component';

/**
 * Characterization of the keepCharacterPositions block of `NgxMaskDirective` input processing.
 * Every expectation records what the directive does TODAY, so a later extraction of the block
 * into a pure function can be proven behaviour-preserving. Cases marked `// current behaviour`
 * look odd on purpose: they are pinned, not endorsed.
 */

type Config = Partial<{
    [
        K in keyof TestMaskComponent as TestMaskComponent[K] extends { set: unknown } ? K : never
    ]: TestMaskComponent[K] extends { set: (v: infer V) => void } ? V : never;
}>;

type Case = {
    name: string;
    config: Config;
    /** Value written through the form control before the edit. */
    initial: string;
    /** Keys typed one by one into the field after `initial`, as a user would. */
    typed?: string;
    /** The caret stays where focusing the field left it (the end) instead of the first slot. */
    caretAtEnd?: boolean;
    /** An earlier edit applied after `initial` / `typed`, to set up gaps. */
    first?: EditAction;
    action: EditAction;
    /** Keys typed one by one at the caret the action left behind. */
    then?: string;
    expected: Omit<EditSnapshot, 'prevented'> & { prevented?: boolean };
};

async function run(
    config: Config,
    initial: string,
    action: EditAction,
    typed?: string,
    first?: EditAction,
    caretAtEnd?: boolean,
    then?: string
): Promise<EditSnapshot> {
    const harness = createHarness();
    for (const [key, value] of Object.entries(config)) {
        (harness.component as unknown as Record<string, { set: (v: unknown) => void }>)[key]?.set(
            value
        );
    }
    harness.fixture.detectChanges();
    // Land the configuration's deferred writes before the user acts, as a real page would.
    await harness.settle();
    await harness.write(initial);
    if (typed) {
        if (!caretAtEnd) {
            // A click on an empty masked field puts the caret in front of the first slot.
            const slot = (config.prefix ?? '').length;
            harness.el.setSelectionRange(slot, slot);
        }
        await harness.type(typed);
    }
    if (first) {
        await harness.edit(first);
    }
    const snap = await harness.edit(action);
    return then ? harness.type(then) : snap;
}

function check(cases: Case[]): void {
    for (const c of cases) {
        it(c.name, async () => {
            const snap = await run(
                c.config,
                c.initial,
                c.action,
                c.typed,
                c.first,
                c.caretAtEnd,
                c.then
            );
            expect(snap).toEqual({ prevented: false, ...c.expected });
        });
    }
}

const phone: Config = {
    mask: '(000) 000-0000',
    keepCharacterPositions: true,
    showMaskTyped: true,
};
const letters: Config = { mask: 'AAA-000', keepCharacterPositions: true, showMaskTyped: true };
const bare: Config = { mask: '000-000', keepCharacterPositions: true };
const maskedBare: Config = { ...bare, showMaskTyped: true };
const withPrefix: Config = {
    mask: '000-000',
    prefix: '+7 ',
    keepCharacterPositions: true,
    showMaskTyped: true,
};
const withSuffix: Config = {
    mask: '000',
    suffix: ' kg',
    keepCharacterPositions: true,
    showMaskTyped: true,
};
const bareSuffixed: Config = {
    mask: '(000) 000-0000',
    prefix: '+7 ',
    suffix: ' kg',
    keepCharacterPositions: true,
};
const bareKg: Config = { mask: '000-000', suffix: ' kg', keepCharacterPositions: true };
const phoneKg: Config = { mask: '(000) 000-0000', suffix: ' kg', keepCharacterPositions: true };
const withBoth: Config = {
    mask: '000',
    prefix: '$',
    suffix: ' USD',
    keepCharacterPositions: true,
    showMaskTyped: true,
};

describe('keepCharacterPositions characterization', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Backspace on a filled (000) 000-0000 with showMaskTyped', () => {
        check([
            {
                name: 'blanks the digit before the caret and keeps the layout',
                config: phone,
                initial: '0123456789',
                action: { start: 8, end: 8, key: 'Backspace' },
                expected: { value: '(012) 3_5-6789', caret: 7, model: '012356789' },
            },
            {
                name: 'blanks the first digit of the second group',
                config: phone,
                initial: '0123456789',
                action: { start: 7, end: 7, key: 'Backspace' },
                expected: { value: '(012) _45-6789', caret: 6, model: '012456789' },
            },
            {
                name: 'after a ") " separator pair blanks the digit before it',
                config: phone,
                initial: '0123456789',
                action: { start: 6, end: 6, key: 'Backspace' },
                expected: { value: '(01_) 345-6789', caret: 3, model: '013456789' },
            },
            {
                name: 'after a single ")" blanks the digit before it',
                config: phone,
                initial: '0123456789',
                action: { start: 5, end: 5, key: 'Backspace' },
                expected: { value: '(01_) 345-6789', caret: 3, model: '013456789' },
            },
            {
                name: 'after the "-" separator blanks the digit before it',
                config: phone,
                initial: '0123456789',
                action: { start: 10, end: 10, key: 'Backspace' },
                expected: { value: '(012) 34_-6789', caret: 8, model: '012346789' },
            },
            {
                name: 'after a ") " separator pair the next digit lands in the blanked slot',
                config: phone,
                initial: '0123456789',
                action: { start: 6, end: 6, key: 'Backspace' },
                then: '9',
                expected: { value: '(019) 345-6789', caret: 4, model: '0193456789' },
            },
            {
                name: 'after the "-" separator the next digit lands in the blanked slot',
                config: phone,
                initial: '0123456789',
                action: { start: 10, end: 10, key: 'Backspace' },
                then: '9',
                expected: { value: '(012) 349-6789', caret: 9, model: '0123496789' },
            },
            {
                // a manual selection of only the separators is not widened
                name: 'a selection of only the ") " separators changes nothing',
                config: phone,
                initial: '0123456789',
                action: { start: 4, end: 6, key: 'Backspace' },
                expected: { value: '(012) 345-6789', caret: 4, model: '0123456789' },
            },
            {
                name: 'blanks the last digit when the caret is at the end',
                config: phone,
                initial: '0123456789',
                action: { start: 14, end: 14, key: 'Backspace' },
                expected: { value: '(012) 345-678_', caret: 13, model: '012345678' },
            },
            {
                name: 'deleting the leading "(" (caret 1) leaves the layout intact',
                config: phone,
                initial: '0123456789',
                action: { start: 1, end: 1, key: 'Backspace' },
                expected: { value: '(012) 345-6789', caret: 0, model: '0123456789' },
            },
            {
                name: 'blanks the first digit (caret 2)',
                config: phone,
                initial: '0123456789',
                action: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '(_12) 345-6789', caret: 1, model: '123456789' },
            },
        ]);
    });

    describe('Delete on a filled (000) 000-0000 with showMaskTyped', () => {
        check([
            {
                name: 'blanks the digit after the caret and advances the caret',
                config: phone,
                initial: '0123456789',
                action: { start: 7, end: 7, key: 'Delete' },
                expected: { value: '(012) 3_5-6789', caret: 8, model: '012356789' },
            },
            {
                // current behaviour: Delete in front of a separator does not blank anything
                name: 'Delete in front of ")" leaves the value unchanged and moves the caret past it',
                config: phone,
                initial: '0123456789',
                action: { start: 4, end: 4, key: 'Delete' },
                expected: { value: '(012) 345-6789', caret: 5, model: '0123456789' },
            },
            {
                name: 'Delete in front of "(" at caret 0',
                config: phone,
                initial: '0123456789',
                action: { start: 0, end: 0, key: 'Delete' },
                expected: { value: '(012) 345-6789', caret: 1, model: '0123456789' },
            },
            {
                name: 'Delete in front of "-"',
                config: phone,
                initial: '0123456789',
                action: { start: 9, end: 9, key: 'Delete' },
                expected: { value: '(012) 345-6789', caret: 10, model: '0123456789' },
            },
            {
                name: 'Delete on the last digit',
                config: phone,
                initial: '0123456789',
                action: { start: 13, end: 13, key: 'Delete' },
                expected: { value: '(012) 345-678_', caret: 14, model: '012345678' },
            },
            {
                // the browser fires no input event when there is nothing to delete
                name: 'Delete at the very end changes nothing',
                config: phone,
                initial: '0123456789',
                action: { start: 14, end: 14, key: 'Delete' },
                expected: { value: '(012) 345-6789', caret: 14, model: '0123456789' },
            },
        ]);
    });

    describe('selection-range delete on (000) 000-0000 with showMaskTyped', () => {
        check([
            {
                name: 'selection starting at the value start is blanked to the skeleton',
                config: phone,
                initial: '0123456789',
                action: { start: 0, end: 6, key: 'Backspace' },
                expected: { value: '(___) 345-6789', caret: 0, model: '3456789' },
            },
            {
                name: 'selecting the whole value blanks every slot',
                config: phone,
                initial: '0123456789',
                action: { start: 0, end: 14, key: 'Backspace' },
                expected: { value: '(___) ___-____', caret: 0, model: '', prevented: true },
            },
            {
                name: 'selection in the middle keeps both sides',
                config: phone,
                initial: '0123456789',
                action: { start: 6, end: 10, key: 'Backspace' },
                expected: { value: '(012) ___-6789', caret: 4, model: '0126789' },
            },
            {
                name: 'selection across a separator keeps the separator',
                config: phone,
                initial: '0123456789',
                action: { start: 3, end: 7, key: 'Delete' },
                expected: { value: '(01_) _45-6789', caret: 3, model: '01456789' },
            },
            {
                name: 'selection reaching the end of the value',
                config: phone,
                initial: '0123456789',
                action: { start: 10, end: 14, key: 'Backspace' },
                expected: { value: '(012) 345-____', caret: 9, model: '012345' },
            },
            {
                name: 'single selected digit',
                config: phone,
                initial: '0123456789',
                action: { start: 2, end: 3, key: 'Backspace' },
                expected: { value: '(0_2) 345-6789', caret: 2, model: '023456789' },
            },
        ]);
    });

    describe('typing over an existing character on (000) 000-0000 with showMaskTyped', () => {
        check([
            {
                name: 'overwrites the digit under the caret',
                config: phone,
                initial: '0123456789',
                action: { start: 2, end: 2, key: '9' },
                expected: { value: '(092) 345-6789', caret: 3, model: '0923456789' },
            },
            {
                name: 'typing before "(" lands in the first slot',
                config: phone,
                initial: '0123456789',
                action: { start: 0, end: 0, key: '9' },
                expected: { value: '(912) 345-6789', caret: 2, model: '9123456789' },
            },
            {
                name: 'typing in front of ")" jumps to the first slot after the separators',
                config: phone,
                initial: '0123456789',
                action: { start: 4, end: 4, key: '9' },
                expected: { value: '(012) 945-6789', caret: 7, model: '0129456789' },
            },
            {
                name: 'typing right after ") " writes the next slot',
                config: phone,
                initial: '0123456789',
                action: { start: 6, end: 6, key: '9' },
                expected: { value: '(012) 945-6789', caret: 7, model: '0129456789' },
            },
            {
                name: 'typing when every slot is already consumed is rejected',
                config: phone,
                initial: '0123456789',
                action: { start: 14, end: 14, key: '9' },
                expected: { value: '(012) 345-6789', caret: 14, model: '0123456789' },
            },
            {
                name: 'typing a letter over a digit slot is rejected',
                config: phone,
                initial: '0123456789',
                action: { start: 2, end: 2, key: 'a' },
                expected: { value: '(012) 345-6789', caret: 2, model: '0123456789' },
            },
            {
                name: 'typing into the last slot',
                config: phone,
                initial: '0123456789',
                action: { start: 13, end: 13, key: '9' },
                expected: { value: '(012) 345-6789', caret: 14, model: '0123456789' },
            },
            {
                name: 'typing into an empty slot of a partly filled value',
                config: phone,
                initial: '012',
                action: { start: 5, end: 5, key: '9' },
                expected: { value: '(012) 9__-____', caret: 7, model: '0129' },
            },
            {
                name: 'typing at the first position of an empty value',
                config: phone,
                initial: '',
                action: { start: 0, end: 0, key: '9' },
                expected: { value: '(9__) ___-____', caret: 2, model: '9' },
            },
        ]);
    });

    describe('selection replaced by a typed character on (000) 000-0000 with showMaskTyped', () => {
        check([
            {
                name: 'the typed digit takes the first slot of the blanked selection',
                config: phone,
                initial: '0123456789',
                action: { start: 1, end: 3, key: '9' },
                expected: { value: '(9_2) 345-6789', caret: 2, model: '923456789' },
            },
            {
                name: 'a selection that starts on a separator moves the digit to the next slot',
                config: phone,
                initial: '0123456789',
                action: { start: 4, end: 8, key: '9' },
                expected: { value: '(012) 9_5-6789', caret: 7, model: '012956789' },
            },
            {
                name: 'selection across separators is blanked and the digit placed first',
                config: phone,
                initial: '0123456789',
                action: { start: 3, end: 7, key: '9' },
                expected: { value: '(019) _45-6789', caret: 4, model: '019456789' },
            },
            {
                name: 'replacing the whole value keeps the skeleton and places the digit',
                config: phone,
                initial: '0123456789',
                action: { start: 0, end: 14, key: '9' },
                expected: { value: '(9__) ___-____', caret: 2, model: '9' },
            },
            {
                name: 'a rejected letter keeps the display and puts the caret at the selection start',
                config: phone,
                initial: '0123456789',
                action: { start: 1, end: 3, key: 'a' },
                expected: { value: '(012) 345-6789', caret: 1, model: '0123456789' },
            },
            {
                name: 'the replaced selection ends at the value end',
                config: phone,
                initial: '0123456789',
                action: { start: 10, end: 14, key: '9' },
                expected: { value: '(012) 345-9___', caret: 11, model: '0123459' },
            },
        ]);
    });

    describe('letters mask AAA-000 with showMaskTyped', () => {
        check([
            {
                name: 'Backspace blanks a letter',
                config: letters,
                initial: 'ABC123',
                action: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: 'A_C-123', caret: 1, model: 'AC123' },
            },
            {
                name: 'Backspace after the "-" blanks the letter before it',
                config: letters,
                initial: 'ABC123',
                action: { start: 4, end: 4, key: 'Backspace' },
                expected: { value: 'AB_-123', caret: 2, model: 'AB123' },
            },
            {
                name: 'Backspace blanks a digit',
                config: letters,
                initial: 'ABC123',
                action: { start: 6, end: 6, key: 'Backspace' },
                expected: { value: 'ABC-1_3', caret: 5, model: 'ABC13' },
            },
            {
                name: 'a digit typed over a letter slot is rejected',
                config: letters,
                initial: 'ABC123',
                action: { start: 0, end: 0, key: '5' },
                expected: { value: '5BC-123', caret: 1, model: '5BC123' },
            },
            {
                name: 'a letter typed over a letter slot overwrites it',
                config: letters,
                initial: 'ABC123',
                action: { start: 1, end: 1, key: 'x' },
                expected: { value: 'AxC-123', caret: 2, model: 'AxC123' },
            },
            {
                name: 'a letter typed in front of "-" jumps into the digit group and is rejected',
                config: letters,
                initial: 'ABC123',
                action: { start: 3, end: 3, key: 'x' },
                expected: { value: 'ABC-123', caret: 3, model: 'ABC123' },
            },
            {
                name: 'a digit typed in front of "-" jumps into the digit group',
                config: letters,
                initial: 'ABC123',
                action: { start: 3, end: 3, key: '7' },
                expected: { value: 'ABC-723', caret: 5, model: 'ABC723' },
            },
            {
                name: 'a letter replacing a digit selection is rejected and the display kept',
                config: letters,
                initial: 'ABC123',
                action: { start: 4, end: 6, key: 'x' },
                expected: { value: 'ABC-123', caret: 4, model: 'ABC123' },
            },
            {
                // current behaviour: a rejected key still destroys the selected characters
                name: 'a digit replacing a letter selection is rejected and the selection blanked',
                config: letters,
                initial: 'ABC123',
                action: { start: 0, end: 2, key: '7' },
                expected: { value: '7_C-123', caret: 1, model: '7C123' },
            },
        ]);
    });

    describe('Delete over a selection leaves the caret on its first blank', () => {
        const configs: [string, Config][] = [
            ['without showMaskTyped', bare],
            ['with showMaskTyped', maskedBare],
        ];
        check(
            configs.flatMap(([label, config]) => [
                {
                    name: `a written value ${label}`,
                    config,
                    initial: '123456',
                    action: { start: 4, end: 5, key: 'Delete' },
                    expected: { value: '123-_56', caret: 4, model: '12356' },
                },
                {
                    name: `a typed value ${label}`,
                    config,
                    initial: '',
                    typed: '123456',
                    action: { start: 4, end: 5, key: 'Delete' },
                    expected: { value: '123-_56', caret: 4, model: '12356' },
                },
                {
                    name: `a digit typed after it fills the blank (${label})`,
                    config,
                    initial: '123456',
                    action: { start: 4, end: 5, key: 'Delete' },
                    then: '7',
                    expected: { value: '123-756', caret: 5, model: '123756' },
                },
                {
                    name: `a collapsed Delete still steps past the blank (${label})`,
                    config,
                    initial: '123456',
                    action: { start: 4, end: 4, key: 'Delete' },
                    expected: { value: '123-_56', caret: 5, model: '12356' },
                },
            ])
        );
    });

    describe('selection delete of a partial value with showMaskTyped (000-000)', () => {
        const typedAndWritten = (
            name: string,
            action: EditAction,
            expected: Case['expected'],
            then?: string
        ): Case[] => [
            {
                name: `${name} (typed)`,
                config: maskedBare,
                initial: '',
                typed: '123',
                action,
                ...(then ? { then } : {}),
                expected,
            },
            {
                name: `${name} (written)`,
                config: maskedBare,
                initial: '123',
                action,
                ...(then ? { then } : {}),
                expected,
            },
        ];
        check([
            ...typedAndWritten(
                'Delete over the last digit keeps the mask tail',
                { start: 2, end: 3, key: 'Delete' },
                { value: '12_-___', caret: 2, model: '12' }
            ),
            ...typedAndWritten(
                'Backspace over the separator keeps the mask tail',
                { start: 3, end: 4, key: 'Backspace' },
                { value: '123-___', caret: 3, model: '123' }
            ),
            ...typedAndWritten(
                'a digit typed after Backspace over the separator lands in the first slot of the tail',
                { start: 3, end: 4, key: 'Backspace' },
                { value: '123-5__', caret: 5, model: '1235' },
                '5'
            ),
        ]);
    });

    describe('keepCharacterPositions without showMaskTyped (000-000)', () => {
        check([
            {
                name: 'a digit typed after a Backspace over a selection to the end appends to the trimmed typed value',
                config: bare,
                initial: '',
                typed: '123456',
                action: { start: 3, end: 7, key: 'Backspace' },
                then: '9',
                expected: { value: '123-9', caret: 5, model: '1239' },
            },
            {
                name: 'a digit typed after a Backspace over a selection to the end appends to the trimmed written value',
                config: bare,
                initial: '123456',
                action: { start: 3, end: 7, key: 'Backspace' },
                then: '9',
                expected: { value: '123-9', caret: 5, model: '1239' },
            },
            {
                name: 'a digit typed after a Delete over a selection to the end appends to the trimmed typed value',
                config: bare,
                initial: '',
                typed: '123456',
                action: { start: 1, end: 7, key: 'Delete' },
                then: '8',
                expected: { value: '18', caret: 2, model: '18' },
            },
            {
                name: 'a digit typed after a Delete over a selection to the end appends to the trimmed written value',
                config: bare,
                initial: '123456',
                action: { start: 1, end: 7, key: 'Delete' },
                then: '8',
                expected: { value: '18', caret: 2, model: '18' },
            },
            {
                name: 'Delete over the whole value is not short-circuited by the keydown clear',
                config: bare,
                initial: '123456',
                action: { start: 0, end: 7, key: 'Delete' },
                expected: { value: '', caret: 0, model: '' },
            },
            {
                name: 'Backspace in the middle keeps a placeholder gap',
                config: bare,
                initial: '123456',
                action: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '1_3-456', caret: 1, model: '13456' },
            },
            {
                name: 'Backspace at the end falls through to regular masking',
                config: bare,
                initial: '123456',
                action: { start: 7, end: 7, key: 'Backspace' },
                expected: { value: '123-45', caret: 6, model: '12345' },
            },
            {
                name: 'Backspace on the last digit of a partial value falls through',
                config: bare,
                initial: '12',
                action: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '1', caret: 1, model: '1' },
            },
            {
                name: 'Backspace right after the separator blanks the digit before it',
                config: bare,
                initial: '123456',
                action: { start: 4, end: 4, key: 'Backspace' },
                expected: { value: '12_-456', caret: 2, model: '12456' },
            },
            {
                name: 'Delete in the middle',
                config: bare,
                initial: '123456',
                action: { start: 1, end: 1, key: 'Delete' },
                expected: { value: '1_3-456', caret: 2, model: '13456' },
            },
            {
                name: 'selecting and deleting the whole value clears it',
                config: bare,
                initial: '123456',
                action: { start: 0, end: 7, key: 'Backspace' },
                expected: { value: '', caret: 0, model: '', prevented: true },
            },
            {
                name: 'selection delete in the middle',
                config: bare,
                initial: '123456',
                action: { start: 1, end: 3, key: 'Backspace' },
                expected: { value: '1__-456', caret: 1, model: '1456' },
            },
            {
                // current behaviour: a partial selection leaves placeholders while a whole-value selection clears the field
                name: 'selection delete from the start blanks the selection to placeholders',
                config: bare,
                initial: '123456',
                action: { start: 0, end: 3, key: 'Backspace' },
                expected: { value: '___-456', caret: 0, model: '456' },
            },
            {
                // the trailing placeholders and separators are dropped, nothing follows them
                name: 'selection delete up to the end drops the trailing placeholders',
                config: bare,
                initial: '123456',
                action: { start: 4, end: 7, key: 'Backspace' },
                expected: { value: '123', caret: 3, model: '123' },
            },
            {
                name: 'selection delete up to the end keeps the gaps of earlier edits',
                config: bare,
                initial: '123456',
                first: { start: 2, end: 2, key: 'Backspace' },
                action: { start: 3, end: 7, key: 'Backspace' },
                expected: { value: '1_3', caret: 3, model: '13' },
            },
            {
                name: 'selection delete up to the end trims the trailing separator and placeholders',
                config: bare,
                initial: '123456',
                action: { start: 2, end: 7, key: 'Backspace' },
                expected: { value: '12', caret: 2, model: '12' },
            },
            {
                name: 'selection delete up to the end after the prefix trims down to the prefix text',
                config: { ...bare, prefix: '+7 ' },
                initial: '123456',
                action: { start: 6, end: 10, key: 'Backspace' },
                expected: { value: '+7 123', caret: 6, model: '123' },
            },
            {
                name: 'replacing the whole value goes through regular masking',
                config: bare,
                initial: '123456',
                action: { start: 0, end: 7, key: '9' },
                expected: { value: '9', caret: 1, model: '9' },
            },
            {
                name: 'replacing a selection keeps the layout',
                config: bare,
                initial: '123456',
                action: { start: 1, end: 3, key: '9' },
                expected: { value: '19_-456', caret: 2, model: '19456' },
            },
            {
                name: 'overwriting a digit in the middle',
                config: bare,
                initial: '123456',
                action: { start: 1, end: 1, key: '9' },
                expected: { value: '193-456', caret: 2, model: '193456' },
            },
            {
                name: 'appending to a partial value uses regular masking',
                config: bare,
                initial: '12',
                action: { start: 2, end: 2, key: '3' },
                expected: { value: '123', caret: 3, model: '123' },
            },
            {
                name: 'first symbol of an empty value uses regular masking',
                config: bare,
                initial: '',
                action: { start: 0, end: 0, key: '1' },
                expected: { value: '1', caret: 1, model: '1' },
            },
            {
                name: 'typing when every slot is consumed without showMaskTyped goes to regular masking',
                config: bare,
                initial: '123456',
                action: { start: 7, end: 7, key: '9' },
                expected: { value: '123-456', caret: 7, model: '123456' },
            },
            {
                name: 'typing in front of the separator jumps over it',
                config: bare,
                initial: '123456',
                action: { start: 3, end: 3, key: '9' },
                expected: { value: '123-956', caret: 5, model: '123956' },
            },
            {
                name: 'a rejected letter keeps the display',
                config: bare,
                initial: '123456',
                action: { start: 1, end: 1, key: 'a' },
                expected: { value: '123-456', caret: 1, model: '123456' },
            },
        ]);
    });

    describe('with a prefix (+7 000-000, showMaskTyped)', () => {
        check([
            {
                name: 'Backspace on the first digit goes through the selStart===1 prefix branch',
                config: withPrefix,
                initial: '123456',
                action: { start: 4, end: 4, key: 'Backspace' },
                expected: { value: '+7 _23-456', caret: 3, model: '23456' },
            },
            {
                name: 'Backspace inside the prefix is prevented',
                config: withPrefix,
                initial: '123456',
                action: { start: 3, end: 3, key: 'Backspace' },
                expected: { value: '+7 123-456', caret: 3, model: '123456', prevented: true },
            },
            {
                name: 'Backspace right after the separator blanks the digit before it',
                config: withPrefix,
                initial: '123456',
                action: { start: 7, end: 7, key: 'Backspace' },
                expected: { value: '+7 12_-456', caret: 5, model: '12456' },
            },
            {
                name: 'Backspace on the second digit',
                config: withPrefix,
                initial: '123456',
                action: { start: 5, end: 5, key: 'Backspace' },
                expected: { value: '+7 1_3-456', caret: 4, model: '13456' },
            },
            {
                name: 'Backspace at the end',
                config: withPrefix,
                initial: '123456',
                action: { start: 10, end: 10, key: 'Backspace' },
                expected: { value: '+7 123-45_', caret: 9, model: '12345' },
            },
            {
                name: 'Delete in front of the first digit blanks it',
                config: withPrefix,
                initial: '123456',
                action: { start: 3, end: 3, key: 'Delete' },
                expected: { value: '+7 _23-456', caret: 4, model: '23456' },
            },
            {
                name: 'Delete in front of the first digit advances the caret to the next slot',
                config: withPrefix,
                initial: '123456',
                action: { start: 3, end: 3, key: 'Delete' },
                then: '9',
                expected: { value: '+7 _93-456', caret: 5, model: '93456' },
            },
            ...[0, 1, 2].map((caret) => ({
                name: `Delete with the caret inside the prefix (${caret}) is prevented`,
                config: withPrefix,
                initial: '123456',
                action: { start: caret, end: caret, key: 'Delete' },
                expected: { value: '+7 123-456', caret: 3, model: '123456', prevented: true },
            })),
            {
                name: 'selection starting right after the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 3, end: 5, key: 'Backspace' },
                expected: { value: '+7 __3-456', caret: 3, model: '3456' },
            },
            {
                name: 'selection in the middle of the digits',
                config: withPrefix,
                initial: '123456',
                action: { start: 5, end: 8, key: 'Backspace' },
                expected: { value: '+7 12_-_56', caret: 5, model: '1256' },
            },
            {
                name: 'selecting the whole value including the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 0, end: 10, key: 'Backspace' },
                expected: { value: '+7 ___-___', caret: 3, model: '' },
            },
            {
                name: 'typing inside the prefix is rejected',
                config: withPrefix,
                initial: '123456',
                action: { start: 2, end: 2, key: '9' },
                expected: { value: '+7 123-456', caret: 2, model: '123456' },
            },
            {
                name: 'typing before the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 0, end: 0, key: '9' },
                expected: { value: '+7 123-456', caret: 3, model: '123456' },
            },
            {
                name: 'typing over the first digit',
                config: withPrefix,
                initial: '123456',
                action: { start: 3, end: 3, key: '9' },
                expected: { value: '+7 923-456', caret: 4, model: '923456' },
            },
            {
                name: 'typing over a middle digit',
                config: withPrefix,
                initial: '123456',
                action: { start: 6, end: 6, key: '9' },
                expected: { value: '+7 123-956', caret: 8, model: '123956' },
            },
            {
                name: 'selection replaced by a typed digit',
                config: withPrefix,
                initial: '123456',
                action: { start: 3, end: 6, key: '9' },
                expected: { value: '+7 9__-456', caret: 4, model: '9456' },
            },
            {
                name: 'a digit replacing a selection that starts inside the prefix keeps the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 1, end: 5, key: '9' },
                expected: { value: '+7 9_3-456', caret: 4, model: '93456' },
            },
            {
                name: 'a digit replacing a selection that spans the end of the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 2, end: 4, key: '9' },
                expected: { value: '+7 923-456', caret: 4, model: '923456' },
            },
            {
                name: 'a digit replacing a selection that ends inside the prefix lands in the first slot',
                config: withPrefix,
                initial: '123456',
                action: { start: 0, end: 2, key: '9' },
                expected: { value: '+7 923-456', caret: 4, model: '923456' },
            },
            {
                name: 'a digit replacing a selection inside the prefix lands in the first slot',
                config: withPrefix,
                initial: '123456',
                action: { start: 1, end: 2, key: '9' },
                expected: { value: '+7 923-456', caret: 4, model: '923456' },
            },
            {
                name: 'a rejected letter over a selection that starts inside the prefix keeps the display',
                config: withPrefix,
                initial: '123456',
                action: { start: 1, end: 5, key: 'a' },
                expected: { value: '+7 123-456', caret: 3, model: '123456' },
            },
            {
                name: 'Backspace over a selection that starts inside the prefix keeps the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 1, end: 5, key: 'Backspace' },
                expected: { value: '+7 __3-456', caret: 3, model: '3456' },
            },
            {
                name: 'Delete over a selection that starts inside the prefix keeps the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 1, end: 5, key: 'Delete' },
                expected: { value: '+7 __3-456', caret: 3, model: '3456' },
            },
            {
                name: 'Backspace over a selection that spans the end of the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 2, end: 4, key: 'Backspace' },
                expected: { value: '+7 _23-456', caret: 3, model: '23456' },
            },
            {
                name: 'Delete over a selection that spans the end of the prefix',
                config: withPrefix,
                initial: '123456',
                action: { start: 2, end: 4, key: 'Delete' },
                expected: { value: '+7 _23-456', caret: 3, model: '23456' },
            },
            {
                name: 'typing into an empty value',
                config: withPrefix,
                initial: '',
                action: { start: 3, end: 3, key: '9' },
                expected: { value: '+7 9__-___', caret: 4, model: '9' },
            },
        ]);
    });

    describe('with a suffix (000 kg, showMaskTyped)', () => {
        check([
            {
                // nothing editable follows the end of the digits: Delete is prevented, so the
                // suffix keeps its leading space and the model stays clean
                name: 'Delete over only the suffix',
                config: withSuffix,
                initial: '123',
                action: { start: 3, end: 6, key: 'Delete' },
                expected: { value: '123 kg', caret: 3, model: '123', prevented: true },
            },
            {
                name: 'Delete at the end of the digits of a written value',
                config: withSuffix,
                initial: '123',
                action: { start: 3, end: 3, key: 'Delete' },
                expected: { value: '123 kg', caret: 3, model: '123', prevented: true },
            },
            {
                name: 'Delete at the end of the digits of a typed value',
                config: withSuffix,
                initial: '',
                typed: '123',
                action: { start: 3, end: 3, key: 'Delete' },
                expected: { value: '123 kg', caret: 3, model: '123', prevented: true },
            },
            {
                // the prevented Delete leaves the caret in front of the suffix: Backspace removes
                // the last digit, which a caret pushed into the suffix would not
                name: 'Delete in front of the suffix keeps the caret there for the next key',
                config: withSuffix,
                initial: '123',
                action: { start: 3, end: 3, key: 'Delete' },
                then: '\b',
                expected: { value: '12_ kg', caret: 2, model: '12' },
            },
            {
                name: 'Backspace over only the suffix',
                config: withSuffix,
                initial: '123',
                action: { start: 3, end: 6, key: 'Backspace' },
                expected: { value: '12_ kg', caret: 2, model: '12' },
            },
            {
                name: 'Backspace on a middle digit keeps the suffix',
                config: withSuffix,
                initial: '123',
                action: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '1_3 kg', caret: 1, model: '13' },
            },
            {
                name: 'Backspace on the last digit',
                config: withSuffix,
                initial: '123',
                action: { start: 3, end: 3, key: 'Backspace' },
                expected: { value: '12_ kg', caret: 2, model: '12' },
            },
            {
                name: 'Delete on the first digit',
                config: withSuffix,
                initial: '123',
                action: { start: 0, end: 0, key: 'Delete' },
                expected: { value: '_23 kg', caret: 1, model: '23' },
            },
            {
                name: 'selection delete in the middle keeps the suffix',
                config: withSuffix,
                initial: '123',
                action: { start: 1, end: 3, key: 'Backspace' },
                expected: { value: '1__ kg', caret: 1, model: '1' },
            },
            {
                name: 'selection delete from the start keeps the suffix',
                config: withSuffix,
                initial: '123',
                action: { start: 0, end: 2, key: 'Backspace' },
                expected: { value: '__3 kg', caret: 0, model: '3' },
            },
            {
                name: 'selection that reaches into the suffix',
                config: withSuffix,
                initial: '123',
                action: { start: 2, end: 6, key: 'Backspace' },
                expected: { value: '12_ kg', caret: 2, model: '12' },
            },
            {
                name: 'typing over a digit',
                config: withSuffix,
                initial: '123',
                action: { start: 1, end: 1, key: '9' },
                expected: { value: '193 kg', caret: 2, model: '193' },
            },
            {
                name: 'typing into an empty slot',
                config: withSuffix,
                initial: '1',
                action: { start: 1, end: 1, key: '9' },
                expected: { value: '19_ kg', caret: 2, model: '19' },
            },
            {
                name: 'typing when every slot is consumed keeps the suffix after a programmatic write',
                config: withSuffix,
                initial: '123',
                action: { start: 3, end: 3, key: '9' },
                expected: { value: '123 kg', caret: 3, model: '123' },
            },
            {
                name: 'typing when every slot is consumed keeps the suffix when the user typed the value',
                config: withSuffix,
                initial: '',
                typed: '123',
                action: { start: 3, end: 3, key: '9' },
                expected: { value: '123 kg', caret: 3, model: '123' },
            },
            {
                name: 'selection replaced by a digit',
                config: withSuffix,
                initial: '123',
                action: { start: 0, end: 2, key: '9' },
                expected: { value: '9_3 kg', caret: 1, model: '93' },
            },
            {
                name: 'a rejected letter keeps the suffix after a programmatic write',
                config: withSuffix,
                initial: '123',
                action: { start: 1, end: 1, key: 'a' },
                expected: { value: '123 kg', caret: 1, model: '123' },
            },
            {
                name: 'a rejected letter keeps the suffix when the user typed the value',
                config: withSuffix,
                initial: '',
                typed: '123',
                action: { start: 1, end: 1, key: 'a' },
                expected: { value: '123 kg', caret: 1, model: '123' },
            },
            {
                name: 'a digit replacing a selection that reaches into the suffix keeps the suffix',
                config: withSuffix,
                initial: '123',
                action: { start: 1, end: 5, key: '9' },
                expected: { value: '19_ kg', caret: 2, model: '19' },
            },
            {
                name: 'a digit replacing a selection that ends on the last suffix character keeps the suffix',
                config: withSuffix,
                initial: '123',
                action: { start: 2, end: 6, key: '9' },
                expected: { value: '129 kg', caret: 3, model: '129' },
            },
            {
                name: 'a digit replacing only the suffix is rejected and the display kept',
                config: withSuffix,
                initial: '123',
                action: { start: 3, end: 6, key: '9' },
                expected: { value: '123 kg', caret: 3, model: '123' },
            },
            {
                name: 'a rejected letter over a selection that reaches into the suffix keeps the display',
                config: withSuffix,
                initial: '123',
                action: { start: 1, end: 5, key: 'a' },
                expected: { value: '123 kg', caret: 1, model: '123' },
            },
        ]);
    });

    describe('with a prefix and a suffix ($000 USD, showMaskTyped)', () => {
        check([
            {
                name: 'Backspace on the first digit',
                config: withBoth,
                initial: '123',
                action: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '$_23 USD', caret: 1, model: '23' },
            },
            {
                name: 'Backspace on a middle digit',
                config: withBoth,
                initial: '123',
                action: { start: 3, end: 3, key: 'Backspace' },
                expected: { value: '$1_3 USD', caret: 2, model: '13' },
            },
            {
                name: 'Backspace on the prefix',
                config: withBoth,
                initial: '123',
                action: { start: 1, end: 1, key: 'Backspace' },
                expected: { value: '$123 USD', caret: 1, model: '123', prevented: true },
            },
            {
                name: 'selection delete',
                config: withBoth,
                initial: '123',
                action: { start: 1, end: 3, key: 'Backspace' },
                expected: { value: '$__3 USD', caret: 1, model: '3' },
            },
            {
                name: 'a digit typed after a selection delete at the prefix fills the first blank (#1710)',
                config: withBoth,
                initial: '123',
                action: { start: 1, end: 2, key: 'Backspace' },
                then: '5',
                expected: { value: '$523 USD', caret: 2, model: '523' },
            },
            {
                name: 'typing over a digit',
                config: withBoth,
                initial: '123',
                action: { start: 2, end: 2, key: '9' },
                expected: { value: '$193 USD', caret: 3, model: '193' },
            },
            {
                name: 'typing before the prefix keeps the suffix after a programmatic write',
                config: withBoth,
                initial: '123',
                action: { start: 0, end: 0, key: '9' },
                expected: { value: '$123 USD', caret: 1, model: '123' },
            },
            {
                name: 'typing before the prefix keeps the suffix when the user typed the value',
                config: withBoth,
                initial: '',
                typed: '123',
                action: { start: 0, end: 0, key: '9' },
                expected: { value: '$123 USD', caret: 1, model: '123' },
            },
            {
                name: 'a digit replacing a selection that starts on the prefix keeps the prefix',
                config: withBoth,
                initial: '123',
                action: { start: 0, end: 3, key: '9' },
                expected: { value: '$9_3 USD', caret: 2, model: '93' },
            },
            {
                name: 'a digit replacing only the prefix lands in the first slot',
                config: withBoth,
                initial: '123',
                action: { start: 0, end: 1, key: '9' },
                expected: { value: '$923 USD', caret: 2, model: '923' },
            },
            {
                name: 'a digit replacing a selection that starts after the prefix',
                config: withBoth,
                initial: '123',
                action: { start: 1, end: 3, key: '9' },
                expected: { value: '$9_3 USD', caret: 2, model: '93' },
            },
            {
                name: 'selection replaced by a digit',
                config: withBoth,
                initial: '123',
                action: { start: 1, end: 3, key: '9' },
                expected: { value: '$9_3 USD', caret: 2, model: '93' },
            },
        ]);
    });

    describe('typing into an empty field with the caret at the end (showMaskTyped)', () => {
        check([
            {
                name: 'the first digit lands in the first slot of the phone skeleton',
                config: phone,
                initial: '',
                caretAtEnd: true,
                action: { start: 14, end: 14, key: '9' },
                expected: { value: '(9__) ___-____', caret: 2, model: '9' },
            },
            {
                name: 'the second digit follows the first one',
                config: phone,
                initial: '',
                caretAtEnd: true,
                typed: '9',
                action: { start: 2, end: 2, key: '8' },
                expected: { value: '(98_) ___-____', caret: 3, model: '98' },
            },
            {
                name: 'the first digit lands in the first slot after the prefix',
                config: withPrefix,
                initial: '',
                caretAtEnd: true,
                action: { start: 10, end: 10, key: '9' },
                expected: { value: '+7 9__-___', caret: 4, model: '9' },
            },
            {
                name: 'the second digit follows the first one after the prefix',
                config: withPrefix,
                initial: '',
                caretAtEnd: true,
                typed: '9',
                action: { start: 4, end: 4, key: '8' },
                expected: { value: '+7 98_-___', caret: 5, model: '98' },
            },
        ]);
    });

    describe('Backspace with the caret inside the suffix', () => {
        check([
            {
                // the leading space of the suffix is not a separator to hop over: the browser's
                // plain delete runs as it did before, and the model follows the display
                name: 'a phone with a suffix: Backspace in the suffix keeps the model in step with the display',
                config: phoneKg,
                initial: '0123456789',
                action: { start: 15, end: 15, key: 'Backspace' },
                expected: { value: '(012) 345-678_ kg', caret: 13, model: '012345678' },
            },
            {
                name: 'a phone with a suffix: the digit typed after Backspace in the suffix reaches the model',
                config: phoneKg,
                initial: '0123456789',
                action: { start: 15, end: 15, key: 'Backspace' },
                then: '9',
                expected: { value: '(012) 345-6789 kg', caret: 14, model: '0123456789' },
            },
            {
                name: 'a prefixed phone with a suffix: Backspace in the suffix keeps the model in step with the display',
                config: bareSuffixed,
                initial: '0123456789',
                action: { start: 18, end: 18, key: 'Backspace' },
                expected: { value: '+7 (012) 345-678_ kg', caret: 16, model: '012345678' },
            },
        ]);
    });

    describe('with a prefix and a suffix without showMaskTyped', () => {
        check([
            {
                name: 'a digit over a selection from the middle of the number into the suffix',
                config: phoneKg,
                initial: '123',
                action: { start: 2, end: 6, key: '9' },
                expected: { value: '(19_ kg', caret: 3, model: '19' },
            },
            {
                name: 'a digit over a selection from the second digit into the suffix',
                config: bareKg,
                initial: '12',
                action: { start: 1, end: 5, key: '7' },
                expected: { value: '17 kg', caret: 2, model: '17' },
            },
            {
                name: 'selection delete up to the end of the number trims the trailing separator',
                config: bareKg,
                initial: '123456',
                action: { start: 4, end: 7, key: 'Backspace' },
                expected: { value: '123 kg', caret: 3, model: '123' },
            },
            {
                name: 'selection delete up to the end of the number trims the placeholders',
                config: bareKg,
                initial: '123456',
                action: { start: 2, end: 7, key: 'Backspace' },
                expected: { value: '12 kg', caret: 2, model: '12' },
            },
            {
                name: 'selection delete up to the end of a short number keeps the suffix once',
                config: bareKg,
                initial: '123',
                action: { start: 1, end: 3, key: 'Backspace' },
                expected: { value: '1 kg', caret: 1, model: '1' },
            },
            {
                name: 'selection delete from the number into the suffix keeps the suffix once',
                config: bareKg,
                initial: '123',
                action: { start: 1, end: 5, key: 'Backspace' },
                expected: { value: '1 kg', caret: 1, model: '1' },
            },
            {
                name: 'selection delete up to the end of the number after a prefix trims down to the digit',
                config: { ...bareKg, prefix: '+7 ' },
                initial: '123456',
                action: { start: 4, end: 10, key: 'Backspace' },
                expected: { value: '+7 1 kg', caret: 4, model: '1' },
            },
            {
                name: 'Delete over a selection up to the end of the number after a prefix keeps the caret before the suffix',
                config: { ...bareKg, prefix: '+7 ' },
                initial: '123456',
                action: { start: 4, end: 10, key: 'Delete' },
                expected: { value: '+7 1 kg', caret: 4, model: '1' },
            },
            {
                name: 'a digit typed after a Delete over a selection up to the end of the number lands in the number',
                config: { ...bareKg, prefix: '+7 ' },
                initial: '123456',
                action: { start: 4, end: 10, key: 'Delete' },
                then: '5',
                expected: { value: '+7 15 kg', caret: 5, model: '15' },
            },
            {
                name: 'Delete over a selection up to the end of a phone number keeps the caret before the suffix',
                config: phoneKg,
                initial: '0123456789',
                action: { start: 2, end: 14, key: 'Delete' },
                expected: { value: '(0 kg', caret: 2, model: '0' },
            },
            {
                name: 'a digit typed after a Delete over a selection up to the end of a phone number lands in the number',
                config: phoneKg,
                initial: '0123456789',
                action: { start: 2, end: 14, key: 'Delete' },
                then: '5',
                expected: { value: '(05 kg', caret: 3, model: '05' },
            },
            {
                name: 'Delete over a selection up to the end of the number without a prefix keeps the caret before the suffix',
                config: bareKg,
                initial: '123456',
                action: { start: 1, end: 7, key: 'Delete' },
                expected: { value: '1 kg', caret: 1, model: '1' },
            },
            {
                name: 'a digit typed after a Delete over a selection up to the end of the number without a prefix lands in the number',
                config: bareKg,
                initial: '123456',
                action: { start: 1, end: 7, key: 'Delete' },
                then: '5',
                expected: { value: '15 kg', caret: 2, model: '15' },
            },
            {
                name: 'selection delete in the middle of the number still keeps the gaps',
                config: { ...bareKg, prefix: '+7 ' },
                initial: '123456',
                action: { start: 5, end: 8, key: 'Backspace' },
                expected: { value: '+7 12_-_56 kg', caret: 5, model: '1256' },
            },
            {
                name: 'a digit replacing a selection that reaches into the suffix keeps the suffix',
                config: bareSuffixed,
                initial: '0123',
                action: { start: 0, end: 11, key: '9' },
                expected: { value: '+7 (9__) _ kg', caret: 5, model: '9' },
            },
            {
                name: 'a digit replacing a selection that ends on the last suffix character keeps the suffix',
                config: bareSuffixed,
                initial: '0123',
                action: { start: 4, end: 13, key: '9' },
                expected: { value: '+7 (9__) _ kg', caret: 5, model: '9' },
            },
            {
                name: 'a digit replacing a selection that stays in front of the suffix keeps the suffix',
                config: bareSuffixed,
                initial: '0123',
                action: { start: 4, end: 7, key: '9' },
                expected: { value: '+7 (9__) 3 kg', caret: 5, model: '93' },
            },
        ]);
    });

    describe('placeholder character', () => {
        check([
            {
                name: 'a custom single-character placeholder fills the blanked slot',
                config: { ...phone, placeHolderCharacter: '*' },
                initial: '0123456789',
                action: { start: 8, end: 8, key: 'Backspace' },
                expected: { value: '(012) 3*5-6789', caret: 7, model: '012356789' },
            },
            {
                name: 'a custom placeholder fills a blanked selection',
                config: { ...phone, placeHolderCharacter: '#' },
                initial: '0123456789',
                action: { start: 6, end: 10, key: 'Backspace' },
                expected: { value: '(012) ###-6789', caret: 4, model: '0126789' },
            },
            {
                name: 'a custom placeholder skeleton without showMaskTyped',
                config: { ...bare, placeHolderCharacter: '#' },
                initial: '123456',
                action: { start: 2, end: 2, key: 'Backspace' },
                expected: { value: '1#3-456', caret: 1, model: '13456' },
            },
        ]);

        // current behaviour: Backspace is a no-op: the deleted digit is re-rendered
        it('a multi-character placeholder disables the block and Backspace restores the digit', async () => {
            // current behaviour: the library only warns about multi-character placeholders
            vi.spyOn(console, 'warn').mockReturnValue();
            const snap = await run({ ...phone, placeHolderCharacter: '__' }, '0123456789', {
                start: 8,
                end: 8,
                key: 'Backspace',
            });
            expect(snap).toEqual({
                prevented: false,
                ...{ value: '(012) 345-6789', caret: 7, model: '0123456789' },
            });
        });
    });

    describe('paste', () => {
        it('a pasted value skips the block and is masked as a whole', async () => {
            const harness = createHarness();
            harness.component.mask.set('000-000');
            harness.component.keepCharacterPositions.set(true);
            harness.component.showMaskTyped.set(true);
            harness.fixture.detectChanges();
            await harness.settle();
            pasteTest('123456', harness.fixture);
            await harness.settle();
            const snap = harness.snapshot();
            expect(snap).toEqual({
                prevented: false,
                ...{ value: '123-456', caret: 7, model: '123456' },
            });
        });
    });
});
