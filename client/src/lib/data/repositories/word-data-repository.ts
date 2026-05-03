import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface UserWordDataRow {
	id: number;
	course_id: number;
	surah_number: number;
	verse_number: number;
	word_position: number;
	personal_meaning: string | null;
	selected_meaning: string | null;
	note: string | null;
	sync_version: number;
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get all user word data for a given course, surah, and verse.
 */
export async function getUserWordData(
	courseId: number,
	surahNumber: number,
	verseNumber: number
): Promise<UserWordDataRow[]> {
	const db = getDb();
	return db.query<UserWordDataRow>(
		`SELECT id, course_id, surah_number, verse_number, word_position,
		        personal_meaning, selected_meaning, note, sync_version
		 FROM USER_WORD_DATA
		 WHERE course_id = ? AND surah_number = ? AND verse_number = ?
		 ORDER BY word_position`,
		[courseId, surahNumber, verseNumber]
	);
}

/**
 * Insert or replace a user word data record for a given course, surah,
 * verse, and word position.
 */
export async function upsertUserWordData(
	courseId: number,
	surahNumber: number,
	verseNumber: number,
	wordPosition: number,
	data: { personalMeaning?: string; selectedMeaning?: string; note?: string }
): Promise<void> {
	const db = getDb();
	await db.run(
		`INSERT INTO USER_WORD_DATA (course_id, surah_number, verse_number, word_position, personal_meaning, selected_meaning, note)
		 VALUES (?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(course_id, surah_number, verse_number, word_position)
		 DO UPDATE SET
		   personal_meaning = COALESCE(excluded.personal_meaning, personal_meaning),
		   selected_meaning = COALESCE(excluded.selected_meaning, selected_meaning),
		   note = COALESCE(excluded.note, note)`,
		[
			courseId,
			surahNumber,
			verseNumber,
			wordPosition,
			data.personalMeaning ?? null,
			data.selectedMeaning ?? null,
			data.note ?? null
		]
	);
}
