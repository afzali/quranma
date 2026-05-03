/**
 * Quran Service — thin service layer between UI components and repositories.
 * Provides a clean API for fetching Surah data and verses.
 */

import {
	getSurahList as repoGetSurahList,
	getSurah as repoGetSurah,
	getSurahVerses as repoGetSurahVerses,
	getVerse as repoGetVerse,
	type SurahInfo,
	type Verse
} from '$lib/data/repositories/quran-repository';

/**
 * Load the list of all 114 Surahs.
 */
export async function loadSurahList(): Promise<SurahInfo[]> {
	return repoGetSurahList();
}

/**
 * Load a single Surah's metadata by number.
 */
export async function loadSurah(surahNumber: number): Promise<SurahInfo | null> {
	return repoGetSurah(surahNumber);
}

/**
 * Load all verses for a given Surah.
 */
export async function loadSurahVerses(surahNumber: number): Promise<Verse[]> {
	return repoGetSurahVerses(surahNumber);
}

/**
 * Load a single verse by Surah and verse number.
 */
export async function loadVerse(
	surahNumber: number,
	verseNumber: number
): Promise<Verse | null> {
	return repoGetVerse(surahNumber, verseNumber);
}

// Re-export types for convenience
export type { SurahInfo, Verse } from '$lib/data/repositories/quran-repository';
