import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface SiyaqGroupRow {
	id: number;
	course_id: number;
	surah_number: number;
	title: string;
	color: string;
	description: string | null;
	created_at: string;
	sync_version: number;
}

export interface SiyaqVerseRow {
	surah_number: number;
	verse_number: number;
}

export interface SiyaqGroupWithVerses extends SiyaqGroupRow {
	verses: SiyaqVerseRow[];
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get all siyaq groups for a given course and surah, including their
 * member verses.
 */
export async function getSiyaqGroupsForSurah(
	courseId: number,
	surahNumber: number
): Promise<SiyaqGroupWithVerses[]> {
	const db = getDb();

	const groups = await db.query<SiyaqGroupRow>(
		`SELECT id, course_id, surah_number, title, color, description, created_at, sync_version
		 FROM SIYAQ_GROUP
		 WHERE course_id = ? AND surah_number = ?
		 ORDER BY created_at`,
		[courseId, surahNumber]
	);

	const result: SiyaqGroupWithVerses[] = [];
	for (const group of groups) {
		const verses = await db.query<SiyaqVerseRow>(
			`SELECT surah_number, verse_number
			 FROM SIYAQ_VERSE
			 WHERE siyaq_group_id = ?
			 ORDER BY verse_number`,
			[group.id]
		);
		result.push({ ...group, verses });
	}

	return result;
}

/**
 * Insert a new siyaq group. Returns the new group's ID.
 */
export async function insertSiyaqGroup(
	courseId: number,
	surahNumber: number,
	title: string,
	color: string,
	description?: string
): Promise<number> {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO SIYAQ_GROUP (course_id, surah_number, title, color, description)
		 VALUES (?, ?, ?, ?, ?)`,
		[courseId, surahNumber, title, color, description ?? null]
	);
	return result.lastInsertRowId;
}

/**
 * Update an existing siyaq group's title, color, or description.
 */
export async function updateSiyaqGroup(
	id: number,
	data: { title?: string; color?: string; description?: string }
): Promise<void> {
	const db = getDb();
	const sets: string[] = [];
	const params: unknown[] = [];

	if (data.title !== undefined) {
		sets.push('title = ?');
		params.push(data.title);
	}
	if (data.color !== undefined) {
		sets.push('color = ?');
		params.push(data.color);
	}
	if (data.description !== undefined) {
		sets.push('description = ?');
		params.push(data.description);
	}

	if (sets.length === 0) return;

	params.push(id);
	await db.run(`UPDATE SIYAQ_GROUP SET ${sets.join(', ')} WHERE id = ?`, params);
}

/**
 * Delete a siyaq group and all its associated verses.
 */
export async function deleteSiyaqGroup(id: number): Promise<void> {
	const db = getDb();
	await db.run('DELETE FROM SIYAQ_VERSE WHERE siyaq_group_id = ?', [id]);
	await db.run('DELETE FROM SIYAQ_GROUP WHERE id = ?', [id]);
}

/**
 * Replace all verse assignments for a siyaq group.
 * Deletes existing verses and inserts the new set.
 */
export async function setSiyaqVerses(
	siyaqGroupId: number,
	verses: { surahNumber: number; verseNumber: number }[]
): Promise<void> {
	const db = getDb();
	await db.run('DELETE FROM SIYAQ_VERSE WHERE siyaq_group_id = ?', [siyaqGroupId]);
	for (const v of verses) {
		await db.run(
			'INSERT INTO SIYAQ_VERSE (siyaq_group_id, surah_number, verse_number) VALUES (?, ?, ?)',
			[siyaqGroupId, v.surahNumber, v.verseNumber]
		);
	}
}
