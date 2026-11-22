import { ChangeDetectionStrategy, Component, forwardRef, input, ViewChild } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';

/** A custom control that hands its whole ControlValueAccessor contract to the inner mask. */
@Component({
    selector: 'ngxd-forwarding-mask-input',
    imports: [NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => ForwardingMaskInputComponent),
        },
    ],
    template: `<input [mask]="mask()" [leadZero]="leadZero()" />`,
})
export class ForwardingMaskInputComponent implements ControlValueAccessor {
    public readonly mask = input.required<string>();
    public readonly leadZero = input(false);
    @ViewChild(NgxMaskDirective, { static: true })
    private readonly _maskDirective!: NgxMaskDirective;

    public writeValue(value: unknown): void {
        this._maskDirective.writeValue(value);
    }

    public registerOnChange(fn: (value: unknown) => void): void {
        this._maskDirective.registerOnChange(fn);
    }

    public registerOnTouched(fn: () => void): void {
        this._maskDirective.registerOnTouched(fn);
    }
}
