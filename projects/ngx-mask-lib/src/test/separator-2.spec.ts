import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { DebugElement } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TestMaskComponent } from './utils/test-component.component';
import { equal } from './utils/test-functions.component';
import { initialConfig, NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { expect, vi } from 'vitest';

describe('Separator: Mask', () => {
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

    it('should keep the cursor position after deleting a character', () => {
        component.mask.set('separator.2');
        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.value = '123 456';
        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        inputElement.setSelectionRange(4, 4);

        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
        fixture.detectChanges();

        expect(inputElement.selectionStart).equal(4);
        expect(inputElement.value).equal('123 456');
    });

    it('should change formValue separator.2', async () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue('10.2');
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('10.20');
        expect(component.form.value).equal('10.20');
    });

    it('should change formValue separator.3', async () => {
        component.mask.set('separator.3');
        component.leadZero.set(true);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue('10.2');
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('10.200');
        expect(component.form.value).equal('10.200');
    });

    it('separator.8 should return value', async () => {
        component.mask.set('separator.8');
        component.thousandSeparator.set('.');
        component.decimalMarker.set(',');

        equal('12,34', '12,34', fixture);

        await fixture.whenStable();
        expect(component.form.value).equal(12.34);
    });

    it('should display value in input with decimalMarker , and leadZero with separator.2', async () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        component.decimalMarker.set(',');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(0.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('0,40');

        component.form.setValue(10.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('10,40');

        component.form.setValue(100.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('100,40');

        component.form.setValue(1000.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('1 000,40');
    });

    it('should display value in input with decimalMarker , and leadZero with separator.3', async () => {
        component.mask.set('separator.3');
        component.leadZero.set(true);
        component.decimalMarker.set(',');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(0.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('0,400');

        component.form.setValue(20.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('20,400');

        component.form.setValue(200.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('200,400');

        component.form.setValue(2000.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('2 000,400');
    });

    it('should display value in input with decimalMarker , and leadZero with separator.3', async () => {
        component.mask.set('separator.3');
        component.leadZero.set(true);
        component.decimalMarker.set(',');
        component.thousandSeparator.set('.');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(0.3);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('0,300');

        component.form.setValue(30.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('30,400');

        component.form.setValue(300.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('300,400');

        component.form.setValue(3000.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('3.000,400');
    });

    it('should display value in input with decimalMarker , and leadZero with separator.2', async () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        component.decimalMarker.set(',');
        component.thousandSeparator.set('.');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(0.3);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('0,30');

        component.form.setValue(30.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('30,40');

        component.form.setValue(300.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('300,40');

        component.form.setValue(3000.4);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('3.000,40');
    });

    it('should not allow add two zeros to inputValue', () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        component.decimalMarker.set(',');
        component.thousandSeparator.set('.');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-00', '-0,0', fixture);
    });

    it('should not allow add two zeros to inputValue', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        component.thousandSeparator.set(',');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-00', '-0.0', fixture);
    });

    it('should not allow add two zeros to inputValue', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set(',');
        component.thousandSeparator.set('.');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-00', '-0,0', fixture);
    });

    it('should not allow add two zeros to inputValue', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set(',');
        component.thousandSeparator.set(' ');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-00', '-0,0', fixture);
    });

    it('should allow minus after change it to true', () => {
        component.mask.set('separator.2');
        component.allowNegativeNumbers.set(false);
        fixture.detectChanges();

        equal('-1234', '1 234', fixture);
        component.allowNegativeNumbers.set(true);
        equal('-1234', '-1 234', fixture);
    });

    it('should change value in formControl mask separator.2', () => {
        component.mask.set('separator.2');
        component.allowNegativeNumbers.set(true);
        component.specialCharacters.set([...initialConfig.specialCharacters]);
        fixture.detectChanges();

        equal('-1234.10', '-1 234.10', fixture);
        expect(component.form.value).equal(-1234.1);
    });

    it('should change value in formControl mask separator.3', () => {
        component.mask.set('separator.3');
        component.allowNegativeNumbers.set(true);
        component.specialCharacters.set([...initialConfig.specialCharacters]);
        fixture.detectChanges();

        equal('-1234.567', '-1 234.567', fixture);
        expect(component.form.value).equal(-1234.567);
    });

    it('should change value in formControl mask separator.1', () => {
        component.mask.set('separator.1');
        component.allowNegativeNumbers.set(true);
        component.specialCharacters.set([...initialConfig.specialCharacters]);
        fixture.detectChanges();

        equal('-1234.9', '-1 234.9', fixture);
        expect(component.form.value).equal(-1234.9);
    });

    it('should change value in formControl mask separator.0', () => {
        component.mask.set('separator.0');
        component.allowNegativeNumbers.set(true);
        component.specialCharacters.set([...initialConfig.specialCharacters]);
        fixture.detectChanges();

        equal('-1234', '-1 234', fixture);
        expect(component.form.value).equal(-1234);
    });

    it('should change value if user star from zero separator.0', () => {
        component.mask.set('separator.0');
        fixture.detectChanges();

        equal('03', '3', fixture);
        equal('034', '34', fixture);
    });

    it('should change value if user star from zero separator.1', () => {
        component.mask.set('separator.1');
        component.decimalMarker.set('.');
        fixture.detectChanges();

        equal('03', '0.3', fixture);
        equal('034', '0.3', fixture);
        equal('.3', '0.3', fixture);
        equal('.34', '0.3', fixture);
    });

    it('should change value if user star from zero separator.1', () => {
        component.mask.set('separator.1');
        component.decimalMarker.set(',');
        fixture.detectChanges();

        equal('03', '0,3', fixture);
        equal('034', '0,3', fixture);
        equal(',3', '0,3', fixture);
        equal(',34', '0,3', fixture);
    });

    it('should change value if user star from zero separator.2', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        fixture.detectChanges();

        equal('03', '0.3', fixture);
        equal('034', '0.34', fixture);
        equal('.3', '0.3', fixture);
        equal('.34', '0.34', fixture);
    });

    it('should change value if user star from zero separator.2', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set(',');
        fixture.detectChanges();

        equal('03', '0,3', fixture);
        equal('034', '0,34', fixture);
        equal(',3', '0,3', fixture);
        equal(',34', '0,34', fixture);
    });

    it('should change value if user star from zero separator.3', () => {
        component.mask.set('separator.3');
        component.decimalMarker.set('.');
        fixture.detectChanges();

        equal('03', '0.3', fixture);
        equal('034', '0.34', fixture);
        equal('.3', '0.3', fixture);
        equal('.34', '0.34', fixture);
        equal('.345', '0.345', fixture);
    });

    it('should change value if user star from zero separator.3', () => {
        component.mask.set('separator.3');
        component.decimalMarker.set(',');
        fixture.detectChanges();

        equal('03', '0,3', fixture);
        equal('034', '0,34', fixture);
        equal(',3', '0,3', fixture);
        equal(',34', '0,34', fixture);
        equal(',345', '0,345', fixture);
    });

    it('should change value if user star from zero separator.0 with allowNegativeNumber', () => {
        component.mask.set('separator.0');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-03', '-3', fixture);
        equal('-034', '-34', fixture);
    });

    it('should change value if user star from zero separator.1 with allowNegativeNumber', () => {
        component.mask.set('separator.1');
        component.decimalMarker.set('.');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-03', '-0.3', fixture);
        equal('-034', '-0.3', fixture);
        equal('-.3', '-0.3', fixture);
        equal('-.34', '-0.3', fixture);
    });

    it('should change value if user star from zero separator.1 with allowNegativeNumber decimalMarker= ,', () => {
        component.mask.set('separator.1');
        component.decimalMarker.set(',');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-03', '-0,3', fixture);
        equal('-034', '-0,3', fixture);
        equal('-,3', '-0,3', fixture);
        equal('-,34', '-0,3', fixture);
    });

    it('should change value if user star from zero separator.2 with allowNegativeNumber', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-03', '-0.3', fixture);
        equal('-034', '-0.34', fixture);
        equal('-.3', '-0.3', fixture);
        equal('-.34', '-0.34', fixture);
    });

    it('should change value if user star from zero separator.2 with allowNegativeNumber', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set(',');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-03', '-0,3', fixture);
        equal('-034', '-0,34', fixture);
        equal('-,3', '-0,3', fixture);
        equal('-,34', '-0,34', fixture);
    });

    it('should change value if user star from zero separator.3 with allowNegativeNumber', () => {
        component.mask.set('separator.3');
        component.decimalMarker.set('.');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-03', '-0.3', fixture);
        equal('-034', '-0.34', fixture);
        equal('-0345', '-0.345', fixture);
        equal('-.3', '-0.3', fixture);
        equal('-.34', '-0.34', fixture);
        equal('-.345', '-0.345', fixture);
    });

    it('should change value if user star from zero separator.3 with allowNegativeNumber', () => {
        component.mask.set('separator.3');
        component.decimalMarker.set(',');
        component.allowNegativeNumbers.set(true);
        fixture.detectChanges();

        equal('-03', '-0,3', fixture);
        equal('-034', '-0,34', fixture);
        equal('-0345', '-0,345', fixture);
        equal('-,3', '-0,3', fixture);
        equal('-,34', '-0,34', fixture);
        equal('-,345', '-0,345', fixture);
    });

    it('should change value if user star from zero separator.1 with allowNegativeNumber leadZero decimalMarker= ,', () => {
        component.mask.set('separator.1');
        component.decimalMarker.set(',');
        component.allowNegativeNumbers.set(true);
        component.leadZero.set(true);
        fixture.detectChanges();

        equal('-03', '-0,3', fixture);
        equal('-034', '-0,3', fixture);
        equal('-,3', '-0,3', fixture);
        equal('-,34', '-0,3', fixture);
    });

    it('should change value if user star from zero separator.1 with allowNegativeNumber leadZero decimalMarker= ,', () => {
        component.mask.set('separator.1');
        component.decimalMarker.set('.');
        component.allowNegativeNumbers.set(true);
        component.leadZero.set(true);
        fixture.detectChanges();

        equal('-03', '-0.3', fixture);
        equal('-034', '-0.3', fixture);
        equal('-.3', '-0.3', fixture);
        equal('-.34', '-0.3', fixture);
    });

    it('should change value if user star from zero separator.1 with allowNegativeNumber leadZero decimalMarker= ,', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set(',');
        component.allowNegativeNumbers.set(true);
        component.leadZero.set(true);
        fixture.detectChanges();

        equal('-03', '-0,3', fixture);
        equal('-034', '-0,34', fixture);
        equal('-,3', '-0,3', fixture);
        equal('-,34', '-0,34', fixture);
    });

    it('should change value if user star from zero separator.2 with allowNegativeNumber leadZero decimalMarker= ,', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        component.allowNegativeNumbers.set(true);
        component.leadZero.set(true);
        fixture.detectChanges();

        equal('-03', '-0.3', fixture);
        equal('-034', '-0.34', fixture);
        equal('-.3', '-0.3', fixture);
        equal('-.34', '-0.34', fixture);
    });

    // #1492: numbers that stringify to exponential notation must be expanded to plain
    // decimal form before separator masking (String(0.0000007) === '7e-7' used to render '77').
    it('should display exponential-format small number from a number FormControl (#1492)', async () => {
        component.mask.set('separator');
        const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
            .nativeElement as HTMLInputElement;
        fixture.detectChanges();

        component.form.setValue(0.0000007);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('0.0000007');
        expect(component.form.value).equal(0.0000007);
    });

    it('should display exponential-format large number from a number FormControl (#1492)', async () => {
        component.mask.set('separator');
        const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
            .nativeElement as HTMLInputElement;
        fixture.detectChanges();

        component.form.setValue(1e21);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('1 000 000 000 000 000 000 000');
        expect(String(component.form.value)).equal('1000000000000000000000');
    });

    it('should display negative exponential-format number from a number FormControl (#1492)', async () => {
        component.mask.set('separator');
        component.allowNegativeNumbers.set(true);
        const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
            .nativeElement as HTMLInputElement;
        fixture.detectChanges();

        component.form.setValue(-0.0000007);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('-0.0000007');
    });

    it('should keep normal number FormControl values unchanged (#1492)', async () => {
        component.mask.set('separator');
        const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
            .nativeElement as HTMLInputElement;
        fixture.detectChanges();

        component.form.setValue(1234.5);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('1 234.5');
    });

    // #1567: values with more significant digits than an IEEE-754 double can hold must not
    // round-trip through Number ('999999999999999.99' used to become '1000000000000000.00').
    it('should not corrupt a number beyond double precision when typing (#1567)', () => {
        component.mask.set('separator.2');
        fixture.detectChanges();

        equal('999999999999999.99', '999 999 999 999 999.99', fixture);
    });

    it('should not corrupt a number beyond double precision with leadZero on setValue (#1567)', async () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
            .nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue('999999999999999.99');
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('999 999 999 999 999.99');
    });

    // Issue #1573: the mask must be locale-independent when decimalMarker/thousandSeparator
    // are explicitly configured. On MS Edge with an Austrian regional format the runtime
    // default locale uses ',' as decimal marker; toLocaleString-based code paths
    // (numberToString / currentLocaleDecimalMarker / the #1492 exponential expansion, whose
    // 'fullwide' locale tag silently falls back to the default locale) then emitted or
    // consumed ',' although the mask was configured with '.' — corrupting values on
    // writeValue and focus/blur reformat.
    describe('locale-independent separator handling (#1573)', () => {
        beforeEach(() => {
            // Simulate a runtime whose DEFAULT locale uses ',' as decimal marker
            // (e.g. Edge with English (Austria) regional format). Any locale tag —
            // including the bogus 'fullwide' — falls back to the default locale,
            // so every toLocaleString call emits a comma-decimal string.
            vi.spyOn(Number.prototype, 'toLocaleString').mockImplementation(function (
                this: number
            ): string {
                return String(this).replace('.', ',');
            });
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should not corrupt a preformatted string value on writeValue (repro 3 from #1573)', async () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set(',');
            component.decimalMarker.set('.');
            const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
                .nativeElement as HTMLInputElement;
            fixture.detectChanges();

            // Under the Austrian default locale the old code replaced the "locale decimal
            // marker" (',') with the configured one ('.') turning '10,000' into '10.000'
            // and masking it as '10.00' — a 1000x value corruption.
            component.form.setValue('10,000');
            fixture.detectChanges();
            await fixture.whenStable();
            expect(inputTarget.value).equal('10,000');

            component.form.setValue('20,000');
            fixture.detectChanges();
            await fixture.whenStable();
            expect(inputTarget.value).equal('20,000');
        });

        it('should format a number FormControl with configured markers only (repro 1 from #1573)', async () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set(',');
            component.decimalMarker.set('.');
            const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
                .nativeElement as HTMLInputElement;
            fixture.detectChanges();

            component.form.setValue(1234.56);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(inputTarget.value).equal('1,234.56');
            expect(component.form.value).equal(1234.56);
        });

        it('should keep typing stable with configured markers under a comma-decimal locale (repro 2 from #1573)', () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set(',');
            component.decimalMarker.set('.');
            fixture.detectChanges();

            equal('10000', '10,000', fixture);
            equal('1000.5', '1,000.5', fixture);
            equal('0.50', '0.50', fixture);
        });

        it('should expand exponential numbers without consulting the runtime locale (#1492 under comma locale)', async () => {
            component.mask.set('separator');
            const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
                .nativeElement as HTMLInputElement;
            fixture.detectChanges();

            component.form.setValue(0.0000007);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(inputTarget.value).equal('0.0000007');
            expect(component.form.value).equal(0.0000007);
        });

        it('should expand large exponential numbers without consulting the runtime locale (#1492 under comma locale)', async () => {
            component.mask.set('separator');
            const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
                .nativeElement as HTMLInputElement;
            fixture.detectChanges();

            component.form.setValue(1e21);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(inputTarget.value).equal('1 000 000 000 000 000 000 000');
            expect(String(component.form.value)).equal('1000000000000000000000');
        });

        it('should apply leadZero precision with configured decimalMarker under a comma-decimal locale', async () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set(',');
            component.decimalMarker.set('.');
            component.leadZero.set(true);
            const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
                .nativeElement as HTMLInputElement;
            fixture.detectChanges();

            component.form.setValue(0.5);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(inputTarget.value).equal('0.50');
        });

        it('should keep comma-decimalMarker configs working under a comma-decimal locale', async () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set('.');
            component.decimalMarker.set(',');
            const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
                .nativeElement as HTMLInputElement;
            fixture.detectChanges();

            component.form.setValue(1234.56);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(inputTarget.value).equal('1.234,56');
        });
    });
});
