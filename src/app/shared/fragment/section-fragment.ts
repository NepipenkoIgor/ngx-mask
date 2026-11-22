/** Menu group that owns the legacy `#N` fragment (Common cases). */
export const DEFAULT_GROUP_ID = 1;

export type SectionFragment = { group: number; section: number };

/**
 * Section ids restart in every menu group, so a fragment names its group: `#N` is a section of
 * the default group (keeps the old links working), `#G-N` is section N of group G.
 */
export function toFragment(group: number, section: number): string {
    return group === DEFAULT_GROUP_ID ? String(section) : `${group}-${section}`;
}

export function parseFragment(fragment: string | null | undefined): SectionFragment | null {
    const match = /^(?:(\d+)-)?(\d+)$/.exec((fragment ?? '').replace(/^#/, ''));
    if (!match) {
        return null;
    }
    return { group: Number(match[1] ?? DEFAULT_GROUP_ID), section: Number(match[2]) };
}
