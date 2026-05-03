import { getDb } from '../database';

/**
 * Get a setting value by key from APP_SETTINGS.
 */
export async function getSetting(key: string): Promise<string | null> {
	const db = getDb();
	const rows = await db.query<{ value: string }>('SELECT value FROM APP_SETTINGS WHERE key = ?', [
		key
	]);
	return rows.length > 0 ? rows[0].value : null;
}

/**
 * Set a setting value by key in APP_SETTINGS.
 * Creates the entry if it doesn't exist, updates it if it does.
 */
export async function setSetting(key: string, value: string): Promise<void> {
	const db = getDb();
	await db.run('INSERT OR REPLACE INTO APP_SETTINGS (key, value) VALUES (?, ?)', [key, value]);
}

/**
 * Get the last selection (Surah and optional verse) from settings.
 * Returns Surah 1 with no verse if no previous selection is stored.
 */
export async function getLastSelection(): Promise<{
	surahNumber: number;
	verseNumber: number | null;
}> {
	const surahStr = await getSetting('last_selection_surah');
	const verseStr = await getSetting('last_selection_verse');

	const surahNumber = surahStr ? parseInt(surahStr, 10) : 1;
	const verseNumber = verseStr ? parseInt(verseStr, 10) : null;

	return {
		surahNumber: isNaN(surahNumber) ? 1 : surahNumber,
		verseNumber: verseNumber !== null && isNaN(verseNumber) ? null : verseNumber
	};
}

/**
 * Save the current selection (Surah and optional verse) to settings.
 */
export async function saveLastSelection(
	surahNumber: number,
	verseNumber: number | null
): Promise<void> {
	await setSetting('last_selection_surah', String(surahNumber));
	if (verseNumber !== null) {
		await setSetting('last_selection_verse', String(verseNumber));
	} else {
		// Clear the verse selection
		await setSetting('last_selection_verse', '');
	}
}

/**
 * Get the saved selection for a specific course from COURSE_SETTINGS.
 */
export async function getCourseSelection(
	courseId: number
): Promise<{ lastSurah: number; lastVerse: number | null } | null> {
	const db = getDb();
	const rows = await db.query<{ last_surah: number | null; last_verse: number | null }>(
		'SELECT last_surah, last_verse FROM COURSE_SETTINGS WHERE course_id = ?',
		[courseId]
	);
	if (rows.length === 0 || rows[0].last_surah == null) return null;
	return {
		lastSurah: rows[0].last_surah,
		lastVerse: rows[0].last_verse ?? null
	};
}

/**
 * Save the current selection for a specific course to COURSE_SETTINGS.
 */
export async function saveCourseSelection(
	courseId: number,
	surahNumber: number,
	verseNumber: number | null
): Promise<void> {
	const db = getDb();
	await db.run(
		`INSERT INTO COURSE_SETTINGS (course_id, last_surah, last_verse)
		 VALUES (?, ?, ?)
		 ON CONFLICT(course_id) DO UPDATE SET last_surah = excluded.last_surah, last_verse = excluded.last_verse`,
		[courseId, surahNumber, verseNumber]
	);
}
