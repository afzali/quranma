import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface UserTafsirRow {
	id: number;
	course_id: number;
	surah_number: number;
	verse_number: number;
	personal_tafsir: string | null;
	note: string | null;
	sync_version: number;
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get the user's personal tafsir for a given course, surah, and verse.
 * Returns null if no record exists.
 */
export async function getUserTafsir(
	courseId: number,
	surahNumber: number,
	verseNumber: number
): Promise<UserTafsirRow | null> {
	const db = getDb();
	const rows = await db.query<UserTafsirRow>(
		`SELECT id, course_id, surah_number, verse_number,
		        personal_tafsir, note, sync_version
		 FROM USER_TAFSIR
		 WHERE course_id = ? AND surah_number = ? AND verse_number = ?`,
		[courseId, surahNumber, verseNumber]
	);
	return rows.length > 0 ? rows[0] : null;
}

/**
 * Insert or replace a user tafsir record for a given course, surah,
 * and verse.
 */
export async function upsertUserTafsir(
	courseId: number,
	surahNumber: number,
	verseNumber: number,
	data: { personalTafsir?: string; note?: string }
): Promise<void> {
	const db = getDb();
	await db.run(
		`INSERT INTO USER_TAFSIR (course_id, surah_number, verse_number, personal_tafsir, note)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(course_id, surah_number, verse_number)
		 DO UPDATE SET
		   personal_tafsir = COALESCE(excluded.personal_tafsir, personal_tafsir),
		   note = COALESCE(excluded.note, note)`,
		[
			courseId,
			surahNumber,
			verseNumber,
			data.personalTafsir ?? null,
			data.note ?? null
		]
	);
}
