import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { TestMaskComponent } from './utils/test-component.component';
import { typeTest } from './utils/test-functions.component';
import { provideNgxMask, NgxMaskDirective } from 'ngx-mask';

// One edit that inserts several characters (autofill, a drop, dictation, a predictive or
// spellcheck replacement) fires a single insertText input event and no paste event. When the
// run ends the value it is formatted as a paste; a run inserted in the middle of the value keeps
// the keystroke path and its caret. Browser twin: bulk-insertion.browser-spec.ts.
describe('Directive: Mask (bulk insertion)', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    function input(): HTMLInputElement {
        return fixture.nativeElement.querySelector('input');
    }

    /** Splice `data` into the value at the selection, as the browser does, then fire `input`. */
    function insertText(data: string): void {
        const el = input();
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? start;
        el.value = el.value.slice(0, start) + data + el.value.slice(end);
        el.setSelectionRange(start + data.length, start + data.length);
        el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data }));
        fixture.detectChanges();
    }

    it('keeps the caret after a run inserted in the middle of the value', async () => {
        component.mask.set('0000-0000');
        fixture.detectChanges();
        component.form.setValue('12345');
        fixture.detectChanges();
        await fixture.whenStable();
        const el = input();
        expect(el.value).toBe('1234-5');

        el.focus();
        el.setSelectionRange(1, 1);
        insertText('99');

        expect(el.value).toBe('1992-345');
        expect(component.form.value).toBe('1992345');
        // right after the inserted run, not at the end of the value
        expect(el.selectionStart).toBe(3);
    });

    it('takes a whole value inserted over the selected value of a hiddenInput field', () => {
        component.mask.set('XXXX');
        component.hiddenInput.set(true);
        fixture.detectChanges();
        expect(typeTest('12', fixture)).toBe('**');
        const el = input();
        el.focus();

        el.setSelectionRange(0, el.value.length);
        insertText('1234');

        expect(el.value).toBe('****');
        expect(component.form.value).toBe('1234');
    });

    it('formats a run inserted in front of the untouched keepCharacterPositions skeleton', async () => {
        component.mask.set('000-000');
        component.showMaskTyped.set(true);
        component.keepCharacterPositions.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        const el = input();
        el.focus();
        el.setSelectionRange(0, 0);
        expect(el.value).toBe('___-___');

        insertText('123');

        expect(el.value).toBe('123-___');
        expect(component.form.value).toBe('123');
    });

    /** A date field holding `value`, its caret at `caret`. */
    async function dateField(value: string, caret: number, kcp = false): Promise<HTMLInputElement> {
        component.mask.set('d0/M0/0000');
        component.keepCharacterPositions.set(kcp);
        fixture.detectChanges();
        component.form.setValue(value);
        fixture.detectChanges();
        await fixture.whenStable();
        const el = input();
        el.focus();
        el.setSelectionRange(caret, caret);
        return el;
    }

    it('types a run inserted into a complete date over the digits that follow it (#1747)', async () => {
        const el = await dateField('12052024', 0);
        insertText('31');
        expect(el.value).toBe('31/05/2024');
        expect(component.form.value).toBe('31052024');

        el.setSelectionRange(6, 6);
        insertText('19');
        expect(el.value).toBe('31/05/1924');
        expect(component.form.value).toBe('31051924');
    });

    it('rejects a pasted date with a field out of range on keepCharacterPositions (#1748)', async () => {
        const el = await dateField('', 0, true);
        insertText('00062020');
        expect(el.value).toBe('');
        expect(component.form.value).toBeFalsy();

        insertText('15062020');
        expect(el.value).toBe('15/06/2020');
        expect(component.form.value).toBe('15062020');
    });

    /** The display and model after `run` is typed one character at a time, and after it is inserted at once. */
    async function typedVersusBulk(
        initial: string,
        caret: number,
        run: string
    ): Promise<{ typed: string[]; bulk: string[] }> {
        let el = await dateField(initial, caret);
        for (const char of run) {
            insertText(char);
        }
        const typed = [el.value, String(component.form.value)];
        el = await dateField(initial, caret);
        insertText(run);
        return { typed, bulk: [el.value, String(component.form.value)] };
    }

    it('types a bulk insert whose first digit overflows its field like single keystrokes (#1759)', async () => {
        for (const run of ['4062020', '2062020', '4122020', '31122020', '0122020', '2112020']) {
            const { typed, bulk } = await typedVersusBulk('', 0, run);
            expect(bulk, run).toEqual(typed);
        }
        expect((await typedVersusBulk('', 0, '4062020')).bulk).toEqual(['4/06/2020', '4062020']);
        expect((await typedVersusBulk('', 0, '2062020')).bulk).toEqual(['20/6/2020', '2062020']);
    });

    it('types a bulk insert into a complete date past a shrinking day like keystrokes (#1759)', async () => {
        for (const [initial, caret, run] of [
            ['15062020', 0, '462020'],
            ['15062020', 3, '22'],
            ['15062020', 3, '2'],
        ] as const) {
            const { typed, bulk } = await typedVersusBulk(initial, caret, run);
            expect(bulk, `${initial}@${caret}+${run}`).toEqual(typed);
        }
    });

    it('applies a run inserted in the middle of a keepCharacterPositions date over the next slots (#1758)', async () => {
        let el = await dateField('15062020', 6, true);
        insertText('19');
        expect(el.value).toBe('15/06/1920');
        expect(component.form.value).toBe('15061920');

        // across a separator, as the same keys typed one by one
        el = await dateField('15062020', 4, true);
        insertText('19');
        expect(el.value).toBe('15/01/9020');
        expect(component.form.value).toBe('15019020');

        // out of range at the end of the value: the whole run is rejected (isPasteOutOfRange);
        // a run in the middle skips only the characters the mask refuses
        el = await dateField('15062020', 3, true);
        insertText('13');
        expect(el.value).toBe('15/06/2020');
        expect(component.form.value).toBe('15062020');
    });

    /** A keepCharacterPositions field of `mask` holding `value`, `[start, end]` selected. */
    async function kcpField(
        mask: string,
        value: string,
        start: number,
        end: number,
        affixes: { prefix?: string; suffix?: string; showMaskTyped?: boolean } = {}
    ) {
        component.mask.set(mask);
        component.prefix.set(affixes.prefix ?? '');
        component.suffix.set(affixes.suffix ?? '');
        component.showMaskTyped.set(affixes.showMaskTyped ?? false);
        component.keepCharacterPositions.set(true);
        fixture.detectChanges();
        component.form.setValue(value);
        fixture.detectChanges();
        await fixture.whenStable();
        const el = input();
        el.focus();
        el.setSelectionRange(start, end);
        return el;
    }

    /** Display, model and caret after `run` is typed one key at a time, and after it is inserted at once. */
    async function kcpTypedVersusBulk(
        mask: string,
        value: string,
        sel: [number, number],
        run: string,
        affixes: { prefix?: string; suffix?: string; showMaskTyped?: boolean } = {}
    ) {
        let el = await kcpField(mask, value, sel[0], sel[1], affixes);
        for (const char of run) {
            insertText(char);
        }
        const typed = [el.value, String(component.form.value), el.selectionStart];
        el = await kcpField(mask, value, sel[0], sel[1], affixes);
        insertText(run);
        return { typed, bulk: [el.value, String(component.form.value), el.selectionStart] };
    }

    it('replaces a selection with a whole run on keepCharacterPositions like keystrokes (#1765 a)', async () => {
        for (const [value, sel, run] of [
            ['123456', [1, 3], '99'],
            ['123456', [0, 2], '789'],
            ['123456', [2, 5], '9'],
        ] as const) {
            const { typed, bulk } = await kcpTypedVersusBulk('000-000', value, [...sel], run);
            expect(bulk, `${value}@${sel.join(',')}+${run}`).toEqual(typed);
        }
        expect((await kcpTypedVersusBulk('000-000', '123456', [1, 3], '99')).bulk[0]).toBe(
            '199-456'
        );
    });

    it('types a run that reaches the end of a keepCharacterPositions value like keystrokes (#1765 b)', async () => {
        for (const [value, caret, run] of [
            ['', 0, '1234'],
            ['12', 2, '345'],
            ['123456', 4, '99'],
        ] as const) {
            const { typed, bulk } = await kcpTypedVersusBulk('000-000', value, [caret, caret], run);
            expect(bulk, `${value}@${caret}+${run}`).toEqual(typed);
        }
    });

    it('skips refused characters and clips a run past the end on keepCharacterPositions (#1765 c)', async () => {
        for (const [value, caret, run] of [
            ['123456', 0, '9a9'],
            ['123456', 1, '9ab'],
            ['123456', 5, '99'],
            ['123456', 3, '7777'],
        ] as const) {
            const { typed, bulk } = await kcpTypedVersusBulk('000-000', value, [caret, caret], run);
            expect(bulk, `${value}@${caret}+${run}`).toEqual(typed);
        }
        expect((await kcpTypedVersusBulk('000-000', '123456', [0, 0], '9a9')).bulk[0]).toBe(
            '993-456'
        );
    });

    it('types a run on keepCharacterPositions next to a prefix and a suffix like keystrokes', async () => {
        for (const [affixes, value, sel, run] of [
            [{ prefix: '$', showMaskTyped: true }, '1234', [1, 1], '99'],
            [{ prefix: '$', showMaskTyped: true }, '1234', [2, 4], '99'],
            [{ prefix: '$', showMaskTyped: true }, '', [1, 1], '123456'],
            [{ prefix: '$', suffix: ' kg', showMaskTyped: true }, '1234', [2, 2], '99'],
            [{ prefix: '$', suffix: ' kg', showMaskTyped: true }, '1234', [1, 3], '9a9'],
            [{ suffix: ' kg', showMaskTyped: true }, '1234', [1, 1], '99'],
            [{ prefix: '$', suffix: ' kg' }, '1234', [2, 2], '99'],
        ] as const) {
            const { typed, bulk } = await kcpTypedVersusBulk(
                '0000.00',
                value,
                [...sel],
                run,
                affixes
            );
            expect(bulk, `${JSON.stringify(affixes)} ${value}@${sel.join(',')}+${run}`).toEqual(
                typed
            );
        }
    });

    it('masks a run inserted before the prefix of an empty keepCharacterPositions field as a paste', async () => {
        const affixes = { prefix: '$', showMaskTyped: true };
        const el = await kcpField('0000.00', '', 0, 0, affixes);
        insertText('123456');
        expect(el.value).toBe('$1234.56');
        expect(component.form.value).toBe('123456');
        expect(el.selectionStart).toBe(8);
    });
});
