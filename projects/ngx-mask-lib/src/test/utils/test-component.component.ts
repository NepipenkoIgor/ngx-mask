import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { NgxMaskConfig } from 'ngx-mask';
import { NGX_MASK_CONFIG } from 'ngx-mask';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    selector: 'ngxd-open-source-test',
    standalone: true,
    imports: [ReactiveFormsModule, NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <input
            id="mask"
            [mask]="mask()"
            [clearIfNotMatch]="clearIfNotMatch()"
            [dropSpecialCharacters]="dropSpecialCharacters()"
            [specialCharacters]="specialCharacters()"
            [patterns]="patterns()"
            [suffix]="suffix()"
            [prefix]="prefix()"
            [thousandSeparator]="thousandSeparator()"
            [decimalMarker]="decimalMarker()"
            [formControl]="form"
            [showMaskTyped]="showMaskTyped()"
            [placeHolderCharacter]="placeHolderCharacter()"
            [separatorLimit]="separatorLimit()"
            [typeFromDecimals]="typeFromDecimals()"
            [hiddenInput]="hiddenInput()"
            [allowNegativeNumbers]="allowNegativeNumbers()"
            [leadZeroDateTime]="leadZeroDateTime()"
            [leadZero]="leadZero()"
            [keepCharacterPositions]="keepCharacterPositions()"
            [apm]="apm()"
            [validation]="validation()"
            [inputTransformFn]="inputTransformFn()"
            [instantPrefix]="instantPrefix()"
            [outputTransformFn]="outputTransformFn()"
            [triggerOnMaskChange]="triggerOnMaskChange()" />
    `,
})
export class TestMaskComponent {
    protected _config = inject<NgxMaskConfig>(NGX_MASK_CONFIG);

    public form: FormControl = new FormControl();

    public mask = signal<string | null | undefined>('');

    public dropSpecialCharacters = signal<NgxMaskConfig['dropSpecialCharacters']>(
        this._config.dropSpecialCharacters
    );
    public hiddenInput = signal<NgxMaskConfig['hiddenInput']>(this._config.hiddenInput);
    public clearIfNotMatch = signal<NgxMaskConfig['clearIfNotMatch']>(this._config.clearIfNotMatch);
    public specialCharacters = signal<NgxMaskConfig['specialCharacters']>(
        this._config.specialCharacters
    );
    public patterns = signal<NgxMaskConfig['patterns']>(this._config.patterns);
    public prefix = signal<NgxMaskConfig['prefix']>(this._config.prefix);
    public suffix = signal<NgxMaskConfig['suffix']>(this._config.suffix);
    public thousandSeparator = signal<NgxMaskConfig['thousandSeparator']>(
        this._config.thousandSeparator
    );
    public decimalMarker = signal<NgxMaskConfig['decimalMarker']>(this._config.decimalMarker);
    public showMaskTyped = signal<NgxMaskConfig['showMaskTyped']>(this._config.showMaskTyped);
    public placeHolderCharacter = signal<NgxMaskConfig['placeHolderCharacter'] | null>(
        this._config.placeHolderCharacter
    );
    public validation = signal<NgxMaskConfig['validation']>(this._config.validation);
    public separatorLimit = signal<NgxMaskConfig['separatorLimit']>(this._config.separatorLimit);
    public typeFromDecimals = signal<NgxMaskConfig['typeFromDecimals']>(
        this._config.typeFromDecimals
    );
    public allowNegativeNumbers = signal<NgxMaskConfig['allowNegativeNumbers']>(
        this._config.allowNegativeNumbers
    );
    public leadZeroDateTime = signal<NgxMaskConfig['leadZeroDateTime']>(
        this._config.leadZeroDateTime
    );
    public leadZero = signal<NgxMaskConfig['leadZero']>(this._config.leadZero);
    public apm = signal<NgxMaskConfig['apm']>(this._config.apm);
    public inputTransformFn = signal<NgxMaskConfig['inputTransformFn']>(
        this._config.inputTransformFn
    );
    public outputTransformFn = signal<NgxMaskConfig['outputTransformFn']>(
        this._config.outputTransformFn
    );
    public keepCharacterPositions = signal<NgxMaskConfig['keepCharacterPositions']>(
        this._config.keepCharacterPositions
    );
    public triggerOnMaskChange = signal<NgxMaskConfig['triggerOnMaskChange']>(
        this._config.triggerOnMaskChange
    );
    public instantPrefix = signal<NgxMaskConfig['instantPrefix']>(this._config.instantPrefix);
}
