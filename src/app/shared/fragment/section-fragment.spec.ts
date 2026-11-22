import { describe, expect, it } from 'vitest';
import { parseFragment, toFragment } from './section-fragment';

describe('section fragment', () => {
    it('keeps the legacy #N form for the default group', () => {
        expect(toFragment(1, 15)).toBe('15');
        expect(parseFragment('#15')).toEqual({ group: 1, section: 15 });
    });

    it('qualifies sections of other groups', () => {
        expect(toFragment(4, 6)).toBe('4-6');
        expect(parseFragment('4-6')).toEqual({ group: 4, section: 6 });
    });

    it('rejects anything else', () => {
        expect(parseFragment('')).toBeNull();
        expect(parseFragment(null)).toBeNull();
        expect(parseFragment('abc')).toBeNull();
    });
});
