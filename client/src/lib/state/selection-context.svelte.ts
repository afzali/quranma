// Selection Context — reactive state for the currently active Surah/Verse selection
// Uses Svelte 5 runes for reactivity

import {
	getLastSelection,
	saveLastSelection,
	getCourseSelection,
	saveCourseSelection
} from '$lib/data/repositories/settings-repository';
import { getActiveCourseId } from '$lib/state/course-context.svelte';

export type Selection = {
	surahNumber: number;
	verseNumber: number | null; // null = Surah-level selection
};

let selection = $state<Selection>({ surahNumber: 1, verseNumber: null });

/**
 * Get the current selection.
 */
export function getSelection(): Selection {
	return selection;
}

/**
 * Select a Surah (clears any verse-level selection).
 * Persists to settings by default.
 */
export function selectSurah(surahNumber: number, persist = true): void {
	selection = { surahNumber, verseNumber: null };
	if (persist) {
		persistSelection();
	}
}

/**
 * Select a specific verse within a Surah.
 * Persists to settings by default.
 */
export function selectVerse(surahNumber: number, verseNumber: number, persist = true): void {
	selection = { surahNumber, verseNumber };
	if (persist) {
		persistSelection();
	}
}

/**
 * Set selection from URL params without persisting.
 * Used by route pages to sync selection state from the URL.
 */
export function setSelectionFromUrl(surahNumber: number, verseNumber: number | null = null): void {
	selection = { surahNumber, verseNumber };
	// Persist after setting from URL so the last viewed position is saved
	persistSelection();
}

/**
 * Check whether the current selection is at the verse level.
 */
export function isVerseLevelSelection(): boolean {
	return selection.verseNumber !== null;
}

/**
 * Restore the last selection.
 * Reads from COURSE_SETTINGS for the active course, falling back to
 * APP_SETTINGS (legacy) and then Surah 1.
 */
export async function restoreSelection(): Promise<void> {
	try {
		const courseId = getActiveCourseId();
		if (courseId) {
			const courseSel = await getCourseSelection(courseId);
			if (courseSel) {
				selection = {
					surahNumber: courseSel.lastSurah,
					verseNumber: courseSel.lastVerse
				};
				return;
			}
		}
		// Fallback to legacy APP_SETTINGS
		const last = await getLastSelection();
		selection = {
			surahNumber: last.surahNumber,
			verseNumber: last.verseNumber
		};
	} catch {
		// Default to Surah 1 if settings can't be read
		selection = { surahNumber: 1, verseNumber: null };
	}
}

/**
 * Persist the current selection.
 * Writes to COURSE_SETTINGS for the active course, and also to
 * APP_SETTINGS as a legacy fallback.
 */
async function persistSelection(): Promise<void> {
	try {
		const courseId = getActiveCourseId();
		if (courseId) {
			await saveCourseSelection(courseId, selection.surahNumber, selection.verseNumber);
		}
		// Also save to legacy APP_SETTINGS for backward compatibility
		await saveLastSelection(selection.surahNumber, selection.verseNumber);
	} catch (e) {
		console.error('Failed to persist selection:', e);
	}
}
