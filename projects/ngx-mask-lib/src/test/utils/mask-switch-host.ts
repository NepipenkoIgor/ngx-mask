import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

/** A reactive-forms input whose mask is switched at runtime (#1701). */
@Component({
    selector: 'ngxd-mask-switch',
    imports: [ReactiveFormsModule, NgxMaskDirective],
    providers: [provideNgxMask()],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input id="masked" [mask]="mask()" [formControl]="control" />`,
})
export class MaskSwitchHost {
    public readonly mask = signal('');
    public readonly control = new FormControl<string | number | null>(null);
}
