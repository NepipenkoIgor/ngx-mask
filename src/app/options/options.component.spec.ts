import { Component, signal, Injector, runInInjectionContext, inject } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import type { NgxMaskOptions } from 'ngx-mask';
import { NgxMaskDirective, provideNgxMask, initialConfig } from 'ngx-mask';
import { expect, describe, it, beforeEach } from 'vitest';

type DecimalMarker = '.' | ',' | ['.', ','];

type MaskTestConfig = {
    mask: string;
    name: string;
    testInput: string;
    expectedDisplay: string;
    expectedFormValue?: string;
    options?: {
        prefix?: string;
        suffix?: string;
        dropSpecialCharacters?: boolean;
        showMaskTyped?: boolean;
        clearIfNotMatch?: boolean;
        validation?: boolean;
        keepCharacterPositions?: boolean;
        allowNegativeNumbers?: boolean;
        hiddenInput?: boolean;
        leadZero?: boolean;
        apm?: boolean;
        decimalMarker?: DecimalMarker;
        thousandSeparator?: string;
        specialCharacters?: string[];
        shownMaskExpression?: string;
        typeFromDecimals?: boolean;
    };
};

@Component({
    selector: 'ngxd-test-reactive',
    standalone: true,
    imports: [ReactiveFormsModule, NgxMaskDirective],
    template: `
        <input
            id="reactive-input"
            [mask]="mask()"
            [prefix]="prefix()"
            [suffix]="suffix()"
            [dropSpecialCharacters]="dropSpecialCharacters()"
            [showMaskTyped]="showMaskTyped()"
            [clearIfNotMatch]="clearIfNotMatch()"
            [validation]="validation()"
            [keepCharacterPositions]="keepCharacterPositions()"
            [allowNegativeNumbers]="allowNegativeNumbers()"
            [hiddenInput]="hiddenInput()"
            [leadZero]="leadZero()"
            [apm]="apm()"
            [decimalMarker]="decimalMarker()"
            [thousandSeparator]="thousandSeparator()"
            [specialCharacters]="specialCharacters()"
            [shownMaskExpression]="shownMaskExpression()"
            [typeFromDecimals]="typeFromDecimals()"
            [defaultValueOnBlur]="defaultValueOnBlur()"
            [formControl]="formControl" />
    `,
})
class TestReactiveComponent {
    public formControl = new FormControl<string | null>('');
    public mask = signal<string>('');
    public prefix = signal<string>('');
    public suffix = signal<string>('');
    public dropSpecialCharacters = signal<boolean>(true);
    public showMaskTyped = signal<boolean>(false);
    public clearIfNotMatch = signal<boolean>(false);
    public validation = signal<boolean>(false);
    public keepCharacterPositions = signal<boolean>(false);
    public allowNegativeNumbers = signal<boolean | null>(null);
    public hiddenInput = signal<boolean | null>(null);
    public leadZero = signal<boolean>(false);
    public apm = signal<boolean>(false);
    public decimalMarker = signal<DecimalMarker>('.');
    public thousandSeparator = signal<string>(' ');
    public specialCharacters = signal<string[]>(initialConfig.specialCharacters as string[]);
    public shownMaskExpression = signal<string | null>(null);
    public typeFromDecimals = signal<boolean>(false);
    public defaultValueOnBlur = signal<string | null>(null);
}

@Component({
    selector: 'ngxd-test-template',
    standalone: true,
    imports: [FormsModule, NgxMaskDirective],
    template: `
        <input
            id="template-input"
            [mask]="mask()"
            [prefix]="prefix()"
            [suffix]="suffix()"
            [dropSpecialCharacters]="dropSpecialCharacters()"
            [showMaskTyped]="showMaskTyped()"
            [clearIfNotMatch]="clearIfNotMatch()"
            [validation]="validation()"
            [keepCharacterPositions]="keepCharacterPositions()"
            [allowNegativeNumbers]="allowNegativeNumbers()"
            [hiddenInput]="hiddenInput()"
            [leadZero]="leadZero()"
            [apm]="apm()"
            [decimalMarker]="decimalMarker()"
            [thousandSeparator]="thousandSeparator()"
            [specialCharacters]="specialCharacters()"
            [shownMaskExpression]="shownMaskExpression()"
            [typeFromDecimals]="typeFromDecimals()"
            [defaultValueOnBlur]="defaultValueOnBlur()"
            [(ngModel)]="model" />
    `,
})
class TestTemplateComponent {
    public model = signal<string | null>('');
    public mask = signal<string>('');
    public prefix = signal<string>('');
    public suffix = signal<string>('');
    public dropSpecialCharacters = signal<boolean>(true);
    public showMaskTyped = signal<boolean>(false);
    public clearIfNotMatch = signal<boolean>(false);
    public validation = signal<boolean>(false);
    public keepCharacterPositions = signal<boolean>(false);
    public allowNegativeNumbers = signal<boolean | null>(null);
    public hiddenInput = signal<boolean | null>(null);
    public leadZero = signal<boolean>(false);
    public apm = signal<boolean>(false);
    public decimalMarker = signal<DecimalMarker>('.');
    public thousandSeparator = signal<string>(' ');
    public specialCharacters = signal<string[]>(initialConfig.specialCharacters as string[]);
    public shownMaskExpression = signal<string | null>(null);
    public typeFromDecimals = signal<boolean>(false);
    public defaultValueOnBlur = signal<string | null>(null);
}

@Component({
    selector: 'ngxd-test-signal',
    standalone: true,
    imports: [ReactiveFormsModule, NgxMaskDirective, FormField],
    template: `
        <input
            id="signal-input"
            [mask]="mask()"
            [prefix]="prefix()"
            [suffix]="suffix()"
            [dropSpecialCharacters]="dropSpecialCharacters()"
            [showMaskTyped]="showMaskTyped()"
            [clearIfNotMatch]="clearIfNotMatch()"
            [validation]="validation()"
            [keepCharacterPositions]="keepCharacterPositions()"
            [allowNegativeNumbers]="allowNegativeNumbers()"
            [hiddenInput]="hiddenInput()"
            [leadZero]="leadZero()"
            [apm]="apm()"
            [decimalMarker]="decimalMarker()"
            [thousandSeparator]="thousandSeparator()"
            [specialCharacters]="specialCharacters()"
            [shownMaskExpression]="shownMaskExpression()"
            [typeFromDecimals]="typeFromDecimals()"
            [defaultValueOnBlur]="defaultValueOnBlur()"
            [formField]="signalForm.value" />
    `,
})
class TestSignalComponent {
    private injector = inject(Injector);
    public signalFormModel = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.signalFormModel));

    public mask = signal<string>('');
    public prefix = signal<string>('');
    public suffix = signal<string>('');
    public dropSpecialCharacters = signal<boolean>(true);
    public showMaskTyped = signal<boolean>(false);
    public clearIfNotMatch = signal<boolean>(false);
    public validation = signal<boolean>(false);
    public keepCharacterPositions = signal<boolean>(false);
    public allowNegativeNumbers = signal<boolean | null>(null);
    public hiddenInput = signal<boolean | null>(null);
    public leadZero = signal<boolean>(false);
    public apm = signal<boolean>(false);
    public decimalMarker = signal<DecimalMarker>('.');
    public thousandSeparator = signal<string>(' ');
    public specialCharacters = signal<string[]>(initialConfig.specialCharacters as string[]);
    public shownMaskExpression = signal<string | null>(null);
    public typeFromDecimals = signal<boolean>(false);
    public defaultValueOnBlur = signal<string | null>(null);
}

function typeValue(
    inputValue: string,
    fixture: ComponentFixture<unknown>,
    inputId: string
): string {
    fixture.detectChanges();
    const inputArray = inputValue.split('');
    const inputElement = fixture.nativeElement.querySelector(`#${inputId}`) as HTMLInputElement;

    inputElement.value = '';
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('ngModelChange'));

    for (const element of inputArray) {
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: element }));
        const selectionStart = inputElement.selectionStart || 0;
        const selectionEnd = inputElement.selectionEnd || 0;
        inputElement.value =
            inputElement.value.slice(0, selectionStart) +
            element +
            inputElement.value.slice(selectionEnd);

        inputElement.selectionStart = selectionStart + 1;
        inputElement.dispatchEvent(new Event('input'));
        inputElement.dispatchEvent(new Event('ngModelChange'));
        fixture.detectChanges();
    }
    return inputElement.value;
}

function pasteValue(
    inputValue: string,
    fixture: ComponentFixture<unknown>,
    inputId: string
): string {
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector(`#${inputId}`) as HTMLInputElement;

    inputElement.value = inputValue;
    inputElement.dispatchEvent(new Event('paste'));
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('ngModelChange'));

    return inputElement.value;
}

type FormMode = 'reactive' | 'template' | 'signal';

const FORM_MODE_CONFIG = {
    reactive: { componentClass: TestReactiveComponent, inputId: 'reactive-input' },
    template: { componentClass: TestTemplateComponent, inputId: 'template-input' },
    signal: { componentClass: TestSignalComponent, inputId: 'signal-input' },
} as const;

function createFixture<T extends FormMode>(
    mode: T,
    ngxMaskOptions?: NgxMaskOptions
): ComponentFixture<InstanceType<(typeof FORM_MODE_CONFIG)[T]['componentClass']>> {
    type Instance = InstanceType<(typeof FORM_MODE_CONFIG)[T]['componentClass']>;
    const { componentClass } = FORM_MODE_CONFIG[mode];
    TestBed.configureTestingModule({
        imports: [componentClass],
        providers: [provideNgxMask(ngxMaskOptions)],
    });
    // Mode-to-class mapping is exhaustive over FORM_MODE_CONFIG, so this cast is safe.
    const fixture = TestBed.createComponent(
        componentClass as unknown as new () => Instance
    ) as unknown as ComponentFixture<Instance>;
    fixture.detectChanges();
    return fixture;
}

function runMaskCasesForMode(
    mode: FormMode,
    testCases: MaskTestConfig[],
    verifyFormValue = false,
    ngxMaskOptions?: NgxMaskOptions
): void {
    let fixture: ComponentFixture<
        TestReactiveComponent | TestTemplateComponent | TestSignalComponent
    >;
    let component: TestReactiveComponent | TestTemplateComponent | TestSignalComponent;
    const { inputId } = FORM_MODE_CONFIG[mode];

    beforeEach(() => {
        fixture = createFixture(mode, ngxMaskOptions);
        component = fixture.componentInstance;
    });

    testCases.forEach((testCase) => {
        it(`should apply ${testCase.name}`, () => {
            applyOptions(component, testCase);
            fixture.detectChanges();

            const result = typeValue(testCase.testInput, fixture, inputId);

            expect(result).equal(testCase.expectedDisplay);
            if (
                verifyFormValue &&
                mode === 'reactive' &&
                testCase.expectedFormValue &&
                component instanceof TestReactiveComponent
            ) {
                expect(component.formControl.value).equal(testCase.expectedFormValue);
            }
        });
    });
}

function applyOptions<
    T extends TestReactiveComponent | TestTemplateComponent | TestSignalComponent,
>(component: T, testCase: MaskTestConfig): void {
    component.mask.set(testCase.mask);
    if (testCase.options?.prefix) {
        component.prefix.set(testCase.options.prefix);
    }
    if (testCase.options?.suffix) {
        component.suffix.set(testCase.options.suffix);
    }
    if (
        typeof testCase.options?.dropSpecialCharacters !== 'undefined' &&
        testCase.options?.dropSpecialCharacters !== null
    ) {
        component.dropSpecialCharacters.set(testCase.options.dropSpecialCharacters);
    }
    if (testCase.options?.showMaskTyped) {
        component.showMaskTyped.set(testCase.options.showMaskTyped);
    }
    if (testCase.options?.clearIfNotMatch) {
        component.clearIfNotMatch.set(testCase.options.clearIfNotMatch);
    }
    if (testCase.options?.validation) {
        component.validation.set(testCase.options.validation);
    }
    if (testCase.options?.keepCharacterPositions) {
        component.keepCharacterPositions.set(testCase.options.keepCharacterPositions);
    }
    if (testCase.options?.allowNegativeNumbers) {
        component.allowNegativeNumbers.set(testCase.options.allowNegativeNumbers);
    }
    if (testCase.options?.hiddenInput) {
        component.hiddenInput.set(testCase.options.hiddenInput);
    }
    if (testCase.options?.leadZero) {
        component.leadZero.set(testCase.options.leadZero);
    }
    if (testCase.options?.apm) {
        component.apm.set(testCase.options.apm);
    }
    if (testCase.options?.decimalMarker) {
        component.decimalMarker.set(testCase.options.decimalMarker);
    }
    if (testCase.options?.thousandSeparator) {
        component.thousandSeparator.set(testCase.options.thousandSeparator);
    }
    if (testCase.options?.specialCharacters) {
        component.specialCharacters.set(testCase.options.specialCharacters);
    }
    if (testCase.options?.shownMaskExpression) {
        component.shownMaskExpression.set(testCase.options.shownMaskExpression);
    }
    if (testCase.options?.typeFromDecimals) {
        component.typeFromDecimals.set(testCase.options.typeFromDecimals);
    }
}

describe('Demo App - Common Cases', () => {
    const commonCasesTests: MaskTestConfig[] = [
        {
            name: 'Date mask (d0/M0/0000)',
            mask: 'd0/M0/0000',
            testInput: '15122023',
            expectedDisplay: '15/12/2023',
            expectedFormValue: '15122023',
        },
        {
            name: 'Date and Hour mask (d0/M0/0000 Hh:m0:s0)',
            mask: 'd0/M0/0000 Hh:m0:s0',
            testInput: '151220231530',
            expectedDisplay: '15/12/2023 15:30',
            expectedFormValue: '151220231530',
        },
        {
            name: 'Valid 24 hour format (Hh:m0:s0)',
            mask: 'Hh:m0:s0',
            testInput: '153045',
            expectedDisplay: '15:30:45',
            expectedFormValue: '153045',
        },
        {
            name: 'Mixed types (AAA 000-S0S)',
            mask: 'AAA 000-S0S',
            testInput: 'ABC123D4E',
            expectedDisplay: 'ABC 123-D4E',
            expectedFormValue: 'ABC123D4E',
        },
        {
            name: 'Valid date start with years (0000.M0.d0)',
            mask: '0000.M0.d0',
            testInput: '20231215',
            expectedDisplay: '2023.12.15',
            expectedFormValue: '20231215',
        },
        {
            name: 'Optional mask (9999 999 999)',
            mask: '9999 999 999',
            testInput: '123456789',
            expectedDisplay: '1234 567 89',
            expectedFormValue: '123456789',
        },
        {
            name: 'Allow negative numbers mask (0000)',
            mask: '0000',
            testInput: '-1234',
            expectedDisplay: '-1234',
            expectedFormValue: '-1234',
            options: { allowNegativeNumbers: true },
        },
        {
            name: 'Multiple masks phone (00) 00000000||+00 (00) 00000000',
            mask: '(00) 00000000||+00 (00) 00000000',
            testInput: '1234567890',
            expectedDisplay: '(12) 34567890',
            expectedFormValue: '1234567890',
        },
        {
            name: 'Multiple masks number or letters (00||SS) - numbers',
            mask: '00||SS',
            testInput: '12',
            expectedDisplay: '12',
            expectedFormValue: '12',
        },
        {
            name: 'Multiple masks letters (00||SS) - letters',
            mask: '00||SS',
            testInput: 'AB',
            expectedDisplay: 'AB',
            expectedFormValue: 'AB',
        },
        {
            name: 'IP address mask (IP)',
            mask: 'IP',
            testInput: '192.168.1.78',
            expectedDisplay: '192.168.1.78',
            expectedFormValue: '192168178',
        },
        {
            name: 'CPF/CNPJ mask (CPF_CNPJ)',
            mask: 'CPF_CNPJ',
            testInput: '12345678901234',
            expectedDisplay: '12.345.678/9012-34',
            expectedFormValue: '12345678901234',
        },
        {
            name: 'CPF/CNPJ alphanumeric mask (CPF_CNPJ_ALPHA)',
            mask: 'CPF_CNPJ_ALPHA',
            testInput: 'ABCDEF01234567',
            expectedDisplay: 'AB.CDE.F01/2345-67',
            expectedFormValue: 'ABCDEF01234567',
        },
    ];

    describe('Reactive Forms', () => {
        runMaskCasesForMode('reactive', commonCasesTests, true);
    });

    describe('Template-driven Forms', () => {
        runMaskCasesForMode('template', commonCasesTests);
    });

    describe('Signal Forms', () => {
        runMaskCasesForMode('signal', commonCasesTests);
    });
});

// Mirrors the demo's provideNgxMask({ maskAliases: { PHONE_BR: ... } }) setup in src/main.ts.
describe('Demo App - Custom mask alias', () => {
    const aliasOptions: NgxMaskOptions = {
        maskAliases: { PHONE_BR: '(00) 00000-0000' },
    };
    const aliasCases: MaskTestConfig[] = [
        {
            name: 'Custom mask alias (PHONE_BR)',
            mask: 'PHONE_BR',
            testInput: '11987654321',
            expectedDisplay: '(11) 98765-4321',
            expectedFormValue: '11987654321',
        },
    ];

    describe('Reactive Forms', () => {
        runMaskCasesForMode('reactive', aliasCases, true, aliasOptions);
    });

    describe('Template-driven Forms', () => {
        runMaskCasesForMode('template', aliasCases, false, aliasOptions);
    });

    describe('Signal Forms', () => {
        runMaskCasesForMode('signal', aliasCases, false, aliasOptions);
    });
});

describe('Demo App - Options', () => {
    // Base tests that work for all form types
    const optionsTests: MaskTestConfig[] = [
        {
            name: 'Prefix (+7)',
            mask: '(00) 000 000',
            testInput: '12345678',
            expectedDisplay: '+7 (12) 345 678',
            expectedFormValue: '12345678',
            options: { prefix: '+7 ' },
        },
        {
            name: 'Suffix ($)',
            mask: '0 000',
            testInput: '1234',
            expectedDisplay: '1 234 $',
            expectedFormValue: '1234',
            options: { suffix: ' $' },
        },
        {
            name: 'dropSpecialCharacters false',
            mask: '000-000.00',
            testInput: '12345678',
            expectedDisplay: '123-456.78',
            expectedFormValue: '123-456.78',
            options: { dropSpecialCharacters: false },
        },
        {
            name: 'showMaskTyped with prefix',
            mask: '(000) 000-0000',
            testInput: '123',
            expectedDisplay: '+7(123) ___-____',
            expectedFormValue: '123',
            options: { showMaskTyped: true, prefix: '+7' },
        },
        {
            name: 'validation true',
            mask: '00 00',
            testInput: '1234',
            expectedDisplay: '12 34',
            expectedFormValue: '1234',
            options: { validation: true },
        },
    ];

    // keepCharacterPositions relies on real browser keydown/selection sequencing
    // (backspace/leftArrow caret math against the showMaskTyped skeleton) that this file's
    // synthetic typeValue()/pasteValue() harness cannot reproduce faithfully in ANY form
    // mode (reactive, template-driven, or signal) - confirmed by reproducing identical
    // corruption in Reactive mode with a hand-rolled native-event probe, so this is not a
    // signal-forms-specific bug. Full E2E coverage (19 cases, incl. delete/backspace/select
    // scenarios) already exists in Cypress:
    // See: projects/ngx-mask-lib/src/test/keep-character-position.cy-spec.ts

    describe('Reactive Forms', () => {
        runMaskCasesForMode('reactive', optionsTests, true);
    });

    describe('Template-driven Forms', () => {
        runMaskCasesForMode('template', optionsTests);
    });

    describe('Signal Forms', () => {
        runMaskCasesForMode('signal', optionsTests);
    });
});

describe('Demo App - Separators', () => {
    const separatorTests: MaskTestConfig[] = [
        {
            name: 'Thousand separator',
            mask: 'separator',
            testInput: '1234567',
            expectedDisplay: '1 234 567',
            expectedFormValue: '1234567',
        },
        {
            name: 'Separator with 2 decimals and leadZero',
            mask: 'separator.2',
            testInput: '123456.78',
            expectedDisplay: '123 456.78',
            expectedFormValue: '123456.78',
            options: { leadZero: true },
        },
        {
            name: 'Dot separator with comma decimal',
            mask: 'separator.2',
            testInput: '123456,78',
            expectedDisplay: '123.456,78',
            expectedFormValue: '123456,78',
            options: { thousandSeparator: '.', decimalMarker: ',' },
        },
        {
            name: 'Comma separator with dot decimal',
            mask: 'separator.2',
            testInput: '123456.78',
            expectedDisplay: '123,456.78',
            expectedFormValue: '123456.78',
            options: { thousandSeparator: ',', decimalMarker: '.' },
        },
        {
            name: 'Zero separator (integer only)',
            mask: 'separator.0',
            testInput: '1234567',
            expectedDisplay: '1 234 567',
            expectedFormValue: '1234567',
        },
        {
            name: 'Banking mode (typeFromDecimals)',
            mask: 'separator.2',
            testInput: '123456',
            expectedDisplay: '1,234.56',
            expectedFormValue: '1234.56',
            options: { typeFromDecimals: true, thousandSeparator: ',' },
        },
    ];

    describe('Reactive Forms', () => {
        runMaskCasesForMode('reactive', separatorTests);
    });

    describe('Template-driven Forms', () => {
        runMaskCasesForMode('template', separatorTests);
    });

    describe('Signal Forms', () => {
        let fixture: ComponentFixture<TestSignalComponent>;
        let component: TestSignalComponent;

        beforeEach(() => {
            fixture = createFixture('signal');
            component = fixture.componentInstance;
        });

        separatorTests.forEach((testCase) => {
            it(`should apply ${testCase.name}`, () => {
                applyOptions(component, testCase);
                fixture.detectChanges();

                const result = typeValue(testCase.testInput, fixture, 'signal-input');

                expect(result).equal(testCase.expectedDisplay);
            });
        });

        it('should NOT add leadZero decimals immediately while typing', () => {
            component.mask.set('separator.2');
            component.leadZero.set(true);
            fixture.detectChanges();

            const inputElement = fixture.nativeElement.querySelector(
                '#signal-input'
            ) as HTMLInputElement;

            inputElement.focus();
            fixture.detectChanges();

            // Type '1'
            inputElement.value = '1';
            inputElement.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            // In Signal Forms, it currently wrongly adds .00 immediately: '1.00'
            // It should stay '1' while typing
            expect(inputElement.value).equal('1');

            // Type '2'
            inputElement.value = '12';
            inputElement.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(inputElement.value).equal('12');
            expect(component.signalFormModel().value).equal('12');

            // Blur should add decimals
            inputElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();

            expect(inputElement.value).equal('12.00');
            expect(component.signalFormModel().value).equal('12.00');
        });
    });
});

// Mirrors the demo's defaultValueOnBlur card: an empty separator.2 input receives
// the masked default '0' on blur, in all three form modes.
describe('Demo App - defaultValueOnBlur', () => {
    (['reactive', 'template', 'signal'] as const).forEach((mode) => {
        describe(`${mode} forms`, () => {
            it('should write the masked default into an empty input on blur', () => {
                const fixture = createFixture(mode);
                const component = fixture.componentInstance;
                component.mask.set('separator.2');
                component.defaultValueOnBlur.set('0');
                fixture.detectChanges();

                const { inputId } = FORM_MODE_CONFIG[mode];
                const inputElement = fixture.nativeElement.querySelector(
                    `#${inputId}`
                ) as HTMLInputElement;

                inputElement.focus();
                fixture.detectChanges();
                expect(inputElement.value).equal('');

                inputElement.dispatchEvent(new Event('blur'));
                fixture.detectChanges();

                expect(inputElement.value).equal('0');
            });

            it('should keep a typed value untouched on blur', () => {
                const fixture = createFixture(mode);
                const component = fixture.componentInstance;
                component.mask.set('separator.2');
                component.defaultValueOnBlur.set('0');
                fixture.detectChanges();

                const { inputId } = FORM_MODE_CONFIG[mode];
                const result = typeValue('12.34', fixture, inputId);
                expect(result).equal('12.34');

                const inputElement = fixture.nativeElement.querySelector(
                    `#${inputId}`
                ) as HTMLInputElement;
                inputElement.dispatchEvent(new Event('blur'));
                fixture.detectChanges();

                expect(inputElement.value).equal('12.34');
            });
        });
    });
});

describe('Demo App - Other Cases', () => {
    const otherTests: MaskTestConfig[] = [
        {
            name: 'Custom specialCharacters [00][000]',
            mask: '[00][000]',
            testInput: '12345',
            expectedDisplay: '[12][345]',
            expectedFormValue: '12345',
            options: { specialCharacters: ['[', ']', '\\'] },
        },
        {
            name: '12 hour format (apm)',
            mask: 'Hh:m0:s0',
            testInput: '123045',
            expectedDisplay: '12:30:45',
            expectedFormValue: '123045',
            options: { apm: true },
        },
        {
            name: 'Percent with comma decimalMarker',
            mask: 'percent.2',
            testInput: '12,34',
            expectedDisplay: '12,34',
            expectedFormValue: '12,34',
            options: { decimalMarker: ',' },
        },
        {
            name: 'Percent with multiple decimalMarkers (comma typed)',
            mask: 'percent.2',
            testInput: '12,34',
            expectedDisplay: '12,34',
            options: { decimalMarker: ['.', ','] },
        },
        {
            name: 'Percent with multiple decimalMarkers (dot typed)',
            mask: 'percent.2',
            testInput: '12.34',
            expectedDisplay: '12.34',
            options: { decimalMarker: ['.', ','] },
        },
    ];

    describe('Reactive Forms', () => {
        runMaskCasesForMode('reactive', otherTests);
    });

    describe('Template-driven Forms', () => {
        runMaskCasesForMode('template', otherTests);
    });

    describe('Signal Forms', () => {
        runMaskCasesForMode('signal', otherTests);
    });
});

describe('Demo App - Email Masks', () => {
    describe('Reactive Forms', () => {
        let fixture: ComponentFixture<TestReactiveComponent>;
        let component: TestReactiveComponent;

        beforeEach(() => {
            fixture = createFixture('reactive');
            component = fixture.componentInstance;
        });

        it('should apply email mask with 3-letter domain (A*@A*.SSS)', () => {
            component.mask.set('A*@A*.SSS');
            component.validation.set(true);
            component.dropSpecialCharacters.set(false);
            fixture.detectChanges();

            const result = typeValue('test@example.com', fixture, 'reactive-input');

            expect(result).equal('test@example.com');
            expect(component.formControl.value).equal('test@example.com');
        });

        it('should apply email mask with multi-letter domain (A*@A*.A*)', () => {
            component.mask.set('A*@A*.A*');
            component.validation.set(true);
            component.dropSpecialCharacters.set(false);
            fixture.detectChanges();

            const result = typeValue('user@domain.co', fixture, 'reactive-input');

            expect(result).equal('user@domain.co');
            expect(component.formControl.value).equal('user@domain.co');
        });
    });

    describe('Template-driven Forms', () => {
        let fixture: ComponentFixture<TestTemplateComponent>;
        let component: TestTemplateComponent;

        beforeEach(() => {
            fixture = createFixture('template');
            component = fixture.componentInstance;
        });

        it('should apply email mask with 3-letter domain (A*@A*.SSS)', () => {
            component.mask.set('A*@A*.SSS');
            component.validation.set(true);
            component.dropSpecialCharacters.set(false);
            fixture.detectChanges();

            const result = typeValue('test@example.com', fixture, 'template-input');

            expect(result).equal('test@example.com');
        });

        it('should apply email mask with multi-letter domain (A*@A*.A*)', () => {
            component.mask.set('A*@A*.A*');
            component.validation.set(true);
            component.dropSpecialCharacters.set(false);
            fixture.detectChanges();

            const result = typeValue('user@domain.co', fixture, 'template-input');

            expect(result).equal('user@domain.co');
        });
    });

    describe('Signal Forms', () => {
        let fixture: ComponentFixture<TestSignalComponent>;
        let component: TestSignalComponent;

        beforeEach(() => {
            fixture = createFixture('signal');
            component = fixture.componentInstance;
        });

        it('should apply email mask with 3-letter domain (A*@A*.SSS)', () => {
            component.mask.set('A*@A*.SSS');
            component.validation.set(true);
            component.dropSpecialCharacters.set(false);
            fixture.detectChanges();

            const result = typeValue('test@example.com', fixture, 'signal-input');

            expect(result).equal('test@example.com');
        });

        it('should apply email mask with multi-letter domain (A*@A*.A*)', () => {
            component.mask.set('A*@A*.A*');
            component.validation.set(true);
            component.dropSpecialCharacters.set(false);
            fixture.detectChanges();

            const result = typeValue('user@domain.co', fixture, 'signal-input');

            expect(result).equal('user@domain.co');
        });
    });
});

describe('Demo App - Mask with specialCharacters', () => {
    describe('Reactive Forms', () => {
        let fixture: ComponentFixture<TestReactiveComponent>;
        let component: TestReactiveComponent;

        beforeEach(() => {
            fixture = createFixture('reactive');
            component = fixture.componentInstance;
        });

        it('should apply phone mask with custom specialCharacters and shownMaskExpression', () => {
            component.mask.set('(000) 000-0000 ext. 000000');
            component.showMaskTyped.set(true);
            component.shownMaskExpression.set('(___) ___-____ ext. ______');
            component.specialCharacters.set(['e', 'x', 't', ' ', '(', ')', '-', '.']);
            fixture.detectChanges();

            const result = typeValue('1234567890123456', fixture, 'reactive-input');

            expect(result).equal('(123) 456-7890 ext. 123456');
            expect(component.formControl.value).equal('1234567890123456');
        });
    });

    describe('Template-driven Forms', () => {
        let fixture: ComponentFixture<TestTemplateComponent>;
        let component: TestTemplateComponent;

        beforeEach(() => {
            fixture = createFixture('template');
            component = fixture.componentInstance;
        });

        it('should apply phone mask with custom specialCharacters and shownMaskExpression', () => {
            component.mask.set('(000) 000-0000 ext. 000000');
            component.showMaskTyped.set(true);
            component.shownMaskExpression.set('(___) ___-____ ext. ______');
            component.specialCharacters.set(['e', 'x', 't', ' ', '(', ')', '-', '.']);
            fixture.detectChanges();

            const result = typeValue('1234567890123456', fixture, 'template-input');

            expect(result).equal('(123) 456-7890 ext. 123456');
        });
    });

    describe('Signal Forms', () => {
        let fixture: ComponentFixture<TestSignalComponent>;
        let component: TestSignalComponent;

        beforeEach(() => {
            fixture = createFixture('signal');
            component = fixture.componentInstance;
        });

        it('should apply phone mask with custom specialCharacters and shownMaskExpression', () => {
            component.mask.set('(000) 000-0000 ext. 000000');
            component.showMaskTyped.set(true);
            component.shownMaskExpression.set('(___) ___-____ ext. ______');
            component.specialCharacters.set(['e', 'x', 't', ' ', '(', ')', '-', '.']);
            fixture.detectChanges();

            const result = typeValue('1234567890123456', fixture, 'signal-input');

            expect(result).equal('(123) 456-7890 ext. 123456');
        });
    });
});

// Note: ClearIfNotMatch tests require focusout/blur event handling which works differently in unit tests
// These tests verify the mask behavior when complete value is entered
describe('Demo App - ClearIfNotMatch', () => {
    describe('Reactive Forms', () => {
        let fixture: ComponentFixture<TestReactiveComponent>;
        let component: TestReactiveComponent;

        beforeEach(() => {
            fixture = createFixture('reactive');
            component = fixture.componentInstance;
        });

        it('should apply mask correctly when clearIfNotMatch is enabled', () => {
            component.mask.set('000-000.00');
            component.clearIfNotMatch.set(true);
            fixture.detectChanges();

            const result = typeValue('12345678', fixture, 'reactive-input');

            expect(result).equal('123-456.78');
        });

        it('should apply partial mask when clearIfNotMatch is enabled', () => {
            component.mask.set('000-000.00');
            component.clearIfNotMatch.set(true);
            fixture.detectChanges();

            const result = typeValue('12345', fixture, 'reactive-input');

            expect(result).equal('123-45');
        });
    });

    describe('Template-driven Forms', () => {
        let fixture: ComponentFixture<TestTemplateComponent>;
        let component: TestTemplateComponent;

        beforeEach(() => {
            fixture = createFixture('template');
            component = fixture.componentInstance;
        });

        it('should apply mask correctly when clearIfNotMatch is enabled', () => {
            component.mask.set('000-000.00');
            component.clearIfNotMatch.set(true);
            fixture.detectChanges();

            const result = typeValue('12345678', fixture, 'template-input');

            expect(result).equal('123-456.78');
        });
    });

    describe('Signal Forms', () => {
        let fixture: ComponentFixture<TestSignalComponent>;
        let component: TestSignalComponent;

        beforeEach(() => {
            fixture = createFixture('signal');
            component = fixture.componentInstance;
        });

        it('should apply mask correctly when clearIfNotMatch is enabled', () => {
            component.mask.set('000-000.00');
            component.clearIfNotMatch.set(true);
            fixture.detectChanges();

            const result = typeValue('12345678', fixture, 'signal-input');

            expect(result).equal('123-456.78');
        });
    });
});

describe('Demo App - Allow negative numbers', () => {
    describe('Reactive Forms', () => {
        let fixture: ComponentFixture<TestReactiveComponent>;
        let component: TestReactiveComponent;

        beforeEach(() => {
            fixture = createFixture('reactive');
            component = fixture.componentInstance;
        });

        it('should allow negative numbers with separator mask', () => {
            component.mask.set('separator');
            component.allowNegativeNumbers.set(true);
            component.decimalMarker.set('.');
            fixture.detectChanges();

            const result = typeValue('-12345', fixture, 'reactive-input');

            expect(result).equal('-12 345');
        });

        it('should allow negative numbers with percent mask', () => {
            component.mask.set('percent.2');
            component.allowNegativeNumbers.set(true);
            component.decimalMarker.set('.');
            fixture.detectChanges();

            const result = typeValue('-50.25', fixture, 'reactive-input');

            expect(result).equal('-50.25');
        });
    });

    describe('Template-driven Forms', () => {
        let fixture: ComponentFixture<TestTemplateComponent>;
        let component: TestTemplateComponent;

        beforeEach(() => {
            fixture = createFixture('template');
            component = fixture.componentInstance;
        });

        it('should allow negative numbers with separator mask', () => {
            component.mask.set('separator');
            component.allowNegativeNumbers.set(true);
            component.decimalMarker.set('.');
            fixture.detectChanges();

            const result = typeValue('-12345', fixture, 'template-input');

            expect(result).equal('-12 345');
        });

        it('should allow negative numbers with percent mask', () => {
            component.mask.set('percent.2');
            component.allowNegativeNumbers.set(true);
            component.decimalMarker.set('.');
            fixture.detectChanges();

            const result = typeValue('-50.25', fixture, 'template-input');

            expect(result).equal('-50.25');
        });
    });

    describe('Signal Forms', () => {
        let fixture: ComponentFixture<TestSignalComponent>;
        let component: TestSignalComponent;

        beforeEach(() => {
            fixture = createFixture('signal');
            component = fixture.componentInstance;
        });

        it('should allow negative numbers with separator mask', () => {
            component.mask.set('separator');
            component.allowNegativeNumbers.set(true);
            component.decimalMarker.set('.');
            fixture.detectChanges();

            const result = typeValue('-12345', fixture, 'signal-input');

            expect(result).equal('-12 345');
        });

        it('should allow negative numbers with percent mask', () => {
            component.mask.set('percent.2');
            component.allowNegativeNumbers.set(true);
            component.decimalMarker.set('.');
            fixture.detectChanges();

            const result = typeValue('-50.25', fixture, 'signal-input');

            expect(result).equal('-50.25');
        });
    });
});

// Secure input test - tested only with Reactive Forms as per library tests
describe('Demo App - Secure input (hiddenInput)', () => {
    describe('Reactive Forms', () => {
        let fixture: ComponentFixture<TestReactiveComponent>;
        let component: TestReactiveComponent;

        beforeEach(() => {
            fixture = createFixture('reactive');
            component = fixture.componentInstance;
        });

        it('should hide X positions with * in mask XXX/XX/XXXX', () => {
            component.mask.set('XXX/XX/XXXX');
            component.hiddenInput.set(true);
            fixture.detectChanges();

            const result = typeValue('123456789', fixture, 'reactive-input');

            expect(result).equal('***/**/****');
            expect(component.formControl.value).equal('123456789');
        });

        it('should hide only X positions in mixed mask XXX/X0/0000', () => {
            component.mask.set('XXX/X0/0000');
            component.hiddenInput.set(true);
            fixture.detectChanges();

            const result = typeValue('1234567890', fixture, 'reactive-input');

            expect(result).equal('***/*5/6789');
            expect(component.formControl.value).equal('123456789');
        });

        it('should show numbers in mask 0000-00-XXXX', () => {
            component.mask.set('0000-00-XXXX');
            component.hiddenInput.set(true);
            fixture.detectChanges();

            const result = typeValue('123456789', fixture, 'reactive-input');

            expect(result).equal('1234-56-***');
            expect(component.formControl.value).equal('123456789');
        });
    });
});

// Test for paste functionality
describe('Demo App - Paste functionality', () => {
    describe('Reactive Forms', () => {
        let fixture: ComponentFixture<TestReactiveComponent>;
        let component: TestReactiveComponent;

        beforeEach(() => {
            fixture = createFixture('reactive');
            component = fixture.componentInstance;
        });

        it('should handle paste for date mask', () => {
            component.mask.set('d0/M0/0000');
            fixture.detectChanges();

            const result = pasteValue('15122023', fixture, 'reactive-input');

            expect(result).equal('15/12/2023');
        });

        it('should handle paste for phone mask', () => {
            component.mask.set('(000) 000-0000');
            fixture.detectChanges();

            const result = pasteValue('1234567890', fixture, 'reactive-input');

            expect(result).equal('(123) 456-7890');
        });
    });

    describe('Template-driven Forms', () => {
        let fixture: ComponentFixture<TestTemplateComponent>;
        let component: TestTemplateComponent;

        beforeEach(() => {
            fixture = createFixture('template');
            component = fixture.componentInstance;
        });

        it('should handle paste for date mask', () => {
            component.mask.set('d0/M0/0000');
            fixture.detectChanges();

            const result = pasteValue('15122023', fixture, 'template-input');

            expect(result).equal('15/12/2023');
        });
    });

    describe('Signal Forms', () => {
        let fixture: ComponentFixture<TestSignalComponent>;
        let component: TestSignalComponent;

        beforeEach(() => {
            fixture = createFixture('signal');
            component = fixture.componentInstance;
        });

        it('should handle paste for date mask', () => {
            component.mask.set('d0/M0/0000');
            fixture.detectChanges();

            const result = pasteValue('15122023', fixture, 'signal-input');

            expect(result).equal('15/12/2023');
        });
    });
});
