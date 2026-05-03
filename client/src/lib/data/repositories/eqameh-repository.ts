import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface EqamehEntryRow {
	id: number;
	course_id: number;
	surah_number: number;
	verse_number: number | null;
	type: string;
	text_content: string;
	created_at: string;
	sync_version: number;
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get all eqameh entries for a given course and surah.
 */
export async function getEqamehEntriesForSurah(
	courseId: number,
	surahNumber: number
): Promise<EqamehEntryRow[]> {
	const db = getDb();
	return db.query<EqamehEntryRow>(
		`SELECT id, course_id, surah_number, verse_number, type,
		        text_content, created_at, sync_version
		 FROM EQAMEH_ENTRY
		 WHERE course_id = ? AND surah_number = ?
		 ORDER BY created_at`,
		[courseId, surahNumber]
	);
}

/**
 * Get eqameh entries for a surah filtered by type.
 */
export async function getEqamehEntriesByType(
	courseId: number,
	surahNumber: number,
	type: string
): Promise<EqamehEntryRow[]> {
	const db = getDb();
	return db.query<EqamehEntryRow>(
		`SELECT id, course_id, surah_number, verse_number, type,
		        text_content, created_at, sync_version
		 FROM EQAMEH_ENTRY
		 WHERE course_id = ? AND surah_number = ? AND type = ?
		 ORDER BY created_at`,
		[courseId, surahNumber, type]
	);
}

/**
 * Insert a new eqameh entry. Returns the new entry's ID.
 */
export async function insertEqamehEntry(
	courseId: number,
	surahNumber: number,
	verseNumber: number | null,
	type: string,
	textContent: string
): Promise<number> {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO EQAMEH_ENTRY (course_id, surah_number, verse_number, type, text_content)
		 VALUES (?, ?, ?, ?, ?)`,
		[courseId, surahNumber, verseNumber, type, textContent]
	);
	return result.lastInsertRowId;
}

/**
 * Update an existing eqameh entry's fields.
 */
export async function updateEqamehEntry(
	id: number,
	data: { type?: string; textContent?: string; verseNumber?: number | null }
): Promise<void> {
	const db = getDb();
	const sets: string[] = [];
	const params: unknown[] = [];

	if (data.type !== undefined) {
		sets.push('type = ?');
		params.push(data.type);
	}
	if (data.textContent !== undefined) {
		sets.push('text_content = ?');
		params.push(data.textContent);
	}
	if (data.verseNumber !== undefined) {
		sets.push('verse_number = ?');
		params.push(data.verseNumber);
	}

	if (sets.length === 0) return;

	params.push(id);
	await db.run(`UPDATE EQAMEH_ENTRY SET ${sets.join(', ')} WHERE id = ?`, params);
}

/**
 * Delete an eqameh entry by ID.
 */
export async function deleteEqamehEntry(id: number): Promise<void> {
	const db = getDb();
	await db.run('DELETE FROM EQAMEH_ENTRY WHERE id = ?', [id]);
}
