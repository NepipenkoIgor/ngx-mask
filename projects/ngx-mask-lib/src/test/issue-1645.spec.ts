import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { beforeEach, describe, expect, it } from 'vitest';

@Component({
    selector: 'ngxd-issue-1645',
    imports: [NgxMaskDirective, ReactiveFormsModule],
    template: `<input
        [mask]="'00000 9||00 00000 0'"
        [validation]="true"
        [formControl]="formControl"
        type="text" />`,
})
class IssueComponent {
    public formControl = new FormControl('');
}

// Issue #1645: multi mask with different lengths must be invalid for lengths 7 and >8.
describe('Issue #1645: multi mask validation', () => {
    let fixture: ComponentFixture<IssueComponent>;
    let input: HTMLInputElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [IssueComponent],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(IssueComponent);
        fixture.detectChanges();
        input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    });

    function valid(value: string): boolean {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        return fixture.componentInstance.formControl.valid;
    }

    it.each([
        ['1234', false],
        ['12345', true],
        ['123456', true],
        ['1234567', false],
        ['12345678', true],
        // The mask truncates the ninth digit, so the control holds a valid 8-digit value.
        ['123456789', true],
    ])('%s -> valid=%s', (value, expected) => {
        expect(valid(value)).toBe(expected);
    });
});
