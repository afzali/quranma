import {
	setSiyaqHighlights,
	setNazmKaviHighlights,
	clearAllHighlights
} from '$lib/state/highlight-context.svelte';
import { getSiyaqGroupsForSurah } from '$lib/data/repositories/siyaq-repository';
import { getNazmKaviItemWithVerses } from '$lib/data/repositories/nazm-kavi-repository';

/**
 * Load siyaq highlights for a given course and surah.
 * Reads all siyaq groups from the repository and updates the
 * highlight context with their colors and verse assignments.
 */
export async function loadSiyaqHighlights(
	courseId: number,
	surahNumber: number
): Promise<void> {
	const groups = await getSiyaqGroupsForSurah(courseId, surahNumber);
	setSiyaqHighlights(
		groups.map((g) => ({
			color: g.color,
			verses: g.verses.map((v) => ({
				surahNumber: v.surah_number,
				verseNumber: v.verse_number
			}))
		}))
	);
}

/**
 * Load nazm-kavi highlights for a specific item.
 * Reads the item's verses from the repository and updates the
 * highlight context with markers.
 */
export async function loadNazmKaviHighlights(nazmKaviId: number): Promise<void> {
	const item = await getNazmKaviItemWithVerses(nazmKaviId);
	if (item) {
		setNazmKaviHighlights(
			item.verses.map((v) => ({
				surahNumber: v.surah_number,
				verseNumber: v.verse_number,
				type: item.type
			}))
		);
	}
}

/**
 * Clear all highlights when the active course changes.
 */
export function clearHighlightsForCourseSwitch(): void {
	clearAllHighlights();
}
