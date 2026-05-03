// Highlight Context — reactive state for verse highlights in the Quran Display
// Uses Svelte 5 runes for reactivity
//
// Manages siyaq color highlights, nazm-kavi markers, and provides
// a centralized map that VerseItem reads from to apply visual styles.

export type HighlightType = 'siyaq' | 'nazm-kavi' | 'selection';

export interface VerseHighlight {
	siyaqColor: string | null;
	nazmKaviActive: boolean;
	nazmKaviType: string | null;
}

// Map key: "surahNumber:verseNumber"
let highlights = $state<Map<string, VerseHighlight>>(new Map());
let showAllSiyaq = $state(false);
let activeNazmKaviId = $state<number | null>(null);

/**
 * Get the full highlights map.
 */
export function getHighlights(): Map<string, VerseHighlight> {
	return highlights;
}

/**
 * Get whether "show all siyaq" is toggled on.
 */
export function getShowAllSiyaq(): boolean {
	return showAllSiyaq;
}

/**
 * Get the currently active nazm-kavi item ID.
 */
export function getActiveNazmKaviId(): number | null {
	return activeNazmKaviId;
}

/**
 * Get the highlight data for a specific verse.
 * Returns null if no highlight exists for that verse.
 */
export function getVerseHighlight(
	surahNumber: number,
	verseNumber: number
): VerseHighlight | null {
	return highlights.get(`${surahNumber}:${verseNumber}`) ?? null;
}

/**
 * Toggle the "show all siyaq" flag.
 */
export function setShowAllSiyaq(value: boolean): void {
	showAllSiyaq = value;
}

/**
 * Set the active nazm-kavi item ID.
 */
export function setActiveNazmKaviId(id: number | null): void {
	activeNazmKaviId = id;
}

/**
 * Apply siyaq color highlights from a list of groups.
 * Clears existing siyaq highlights first, then applies new ones.
 * Preserves any existing nazm-kavi highlights.
 */
export function setSiyaqHighlights(
	groups: { color: string; verses: { surahNumber: number; verseNumber: number }[] }[]
): void {
	const updated = new Map<string, VerseHighlight>();

	// Preserve existing nazm-kavi highlights
	for (const [key, existing] of highlights) {
		if (existing.nazmKaviActive) {
			updated.set(key, {
				siyaqColor: null,
				nazmKaviActive: existing.nazmKaviActive,
				nazmKaviType: existing.nazmKaviType
			});
		}
	}

	// Apply siyaq highlights
	for (const group of groups) {
		for (const v of group.verses) {
			const key = `${v.surahNumber}:${v.verseNumber}`;
			const existing = updated.get(key);
			updated.set(key, {
				siyaqColor: group.color,
				nazmKaviActive: existing?.nazmKaviActive ?? false,
				nazmKaviType: existing?.nazmKaviType ?? null
			});
		}
	}

	highlights = updated;
}

/**
 * Apply nazm-kavi highlights from a list of verses.
 * Clears existing nazm-kavi highlights first, then applies new ones.
 * Preserves any existing siyaq highlights.
 */
export function setNazmKaviHighlights(
	verses: { surahNumber: number; verseNumber: number; type: string }[]
): void {
	const updated = new Map<string, VerseHighlight>();

	// Preserve existing siyaq highlights
	for (const [key, existing] of highlights) {
		if (existing.siyaqColor) {
			updated.set(key, {
				siyaqColor: existing.siyaqColor,
				nazmKaviActive: false,
				nazmKaviType: null
			});
		}
	}

	// Apply nazm-kavi highlights
	for (const v of verses) {
		const key = `${v.surahNumber}:${v.verseNumber}`;
		const existing = updated.get(key);
		updated.set(key, {
			siyaqColor: existing?.siyaqColor ?? null,
			nazmKaviActive: true,
			nazmKaviType: v.type
		});
	}

	highlights = updated;
}

/**
 * Clear all highlights and reset state.
 */
export function clearAllHighlights(): void {
	highlights = new Map();
	showAllSiyaq = false;
	activeNazmKaviId = null;
}
