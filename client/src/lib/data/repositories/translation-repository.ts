import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface UserTranslationRow {
	id: number;
	course_id: number;
	surah_number: number;
	verse_number: number;
	personal_translation: string | null;
	note: string | null;
	sync_version: number;
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get the user's personal translation for a given course, surah, and verse.
 * Returns null if no record exists.
 */
export async function getUserTranslation(
	courseId: number,
	surahNumber: number,
	verseNumber: number
): Promise<UserTranslationRow | null> {
	const db = getDb();
	const rows = await db.query<UserTranslationRow>(
		`SELECT id, course_id, surah_number, verse_number,
		        personal_translation, note, sync_version
		 FROM USER_TRANSLATION
		 WHERE course_id = ? AND surah_number = ? AND verse_number = ?`,
		[courseId, surahNumber, verseNumber]
	);
	return rows.length > 0 ? rows[0] : null;
}

/**
 * Insert or replace a user translation record for a given course, surah,
 * and verse.
 */
export async function upsertUserTranslation(
	courseId: number,
	surahNumber: number,
	verseNumber: number,
	data: { personalTranslation?: string; note?: string }
): Promise<void> {
	const db = getDb();
	await db.run(
		`INSERT INTO USER_TRANSLATION (course_id, surah_number, verse_number, personal_translation, note)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(course_id, surah_number, verse_number)
		 DO UPDATE SET
		   personal_translation = COALESCE(excluded.personal_translation, personal_translation),
		   note = COALESCE(excluded.note, note)`,
		[
			courseId,
			surahNumber,
			verseNumber,
			data.personalTranslation ?? null,
			data.note ?? null
		]
	);
}
