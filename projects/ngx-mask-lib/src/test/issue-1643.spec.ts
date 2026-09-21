import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestMaskComponent } from './utils/test-component.component';
import { equal } from './utils/test-functions.component';

// Issue #1643: `[placeHolderCharacter]="null"` threw once a character was typed.
describe('Issue #1643: null placeHolderCharacter', () => {
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

    it('does not throw and formats the value', () => {
        component.mask.set('0000SS');
        component.placeHolderCharacter.set(null);
        expect(() => equal('1234AB', '1234AB', fixture)).not.toThrow();
    });

    it('formats partial input', () => {
        component.mask.set('0000SS');
        component.placeHolderCharacter.set(null);
        equal('12', '12', fixture);
    });

    it('works with showMaskTyped', () => {
        component.mask.set('0000SS');
        component.placeHolderCharacter.set(null);
        component.showMaskTyped.set(true);
        expect(() => equal('12', '12____', fixture)).not.toThrow();
    });
});
