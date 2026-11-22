import {
    ChangeDetectionStrategy,
    Component,
    Injector,
    inject,
    runInInjectionContext,
    signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ForwardingMaskInputComponent } from './forwarding-mask-input.component';

/** A forwarding wrapper on a control that only takes the view value in at blur. */
@Component({
    selector: 'ngxd-wrapper-update-on-blur-host',
    imports: [ReactiveFormsModule, ForwardingMaskInputComponent],
    providers: [provideNgxMask()],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<ngxd-forwarding-mask-input
        id="amount"
        mask="separator.2"
        [leadZero]="true"
        [formControl]="amount" />`,
})
export class WrapperUpdateOnBlurHost {
    public readonly amount = new FormControl<string | null>(null, { updateOn: 'blur' });
}

/** A forwarding wrapper bound with ngModel inside an ngForm. */
@Component({
    selector: 'ngxd-wrapper-ng-form-host',
    imports: [FormsModule, ForwardingMaskInputComponent],
    providers: [provideNgxMask()],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<form #ngForm="ngForm">
        <ngxd-forwarding-mask-input
            id="amount"
            name="amount"
            mask="separator.2"
            [leadZero]="true"
            [ngModel]="amount()"
            (ngModelChange)="amount.set($event)" />
    </form>`,
})
export class WrapperNgFormHost {
    public readonly amount = signal<string | null>(null);
}

/** A Signal Forms field bound straight to a separator mask. */
@Component({
    selector: 'ngxd-signal-form-separator-host',
    imports: [FormField, NgxMaskDirective],
    providers: [provideNgxMask()],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input id="amount" mask="separator.2" [formField]="tree.amount" />`,
})
export class SignalFormSeparatorHost {
    public readonly data = signal<{ amount: string | number | null }>({ amount: null });
    public readonly tree = runInInjectionContext(inject(Injector), () => form(this.data));
}
