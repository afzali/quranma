import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface NazmKaviItemRow {
	id: number;
	course_id: number;
	type: string;
	title: string;
	description: string | null;
	created_at: string;
	sync_version: number;
}

export interface NazmKaviVerseRow {
	surah_number: number;
	verse_number: number;
}

export interface NazmKaviItemWithVerses extends NazmKaviItemRow {
	verses: NazmKaviVerseRow[];
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get all nazm-kavi items for a given course.
 */
export async function getNazmKaviItemsByCourse(courseId: number): Promise<NazmKaviItemRow[]> {
	const db = getDb();
	return db.query<NazmKaviItemRow>(
		`SELECT id, course_id, type, title, description, created_at, sync_version
		 FROM NAZM_KAVI_ITEM
		 WHERE course_id = ?
		 ORDER BY created_at`,
		[courseId]
	);
}

/**
 * Get a single nazm-kavi item with its associated verses.
 * Returns null if the item doesn't exist.
 */
export async function getNazmKaviItemWithVerses(
	id: number
): Promise<NazmKaviItemWithVerses | null> {
	const db = getDb();
	const items = await db.query<NazmKaviItemRow>(
		`SELECT id, course_id, type, title, description, created_at, sync_version
		 FROM NAZM_KAVI_ITEM
		 WHERE id = ?`,
		[id]
	);
	if (items.length === 0) return null;

	const verses = await db.query<NazmKaviVerseRow>(
		`SELECT surah_number, verse_number
		 FROM NAZM_KAVI_VERSE
		 WHERE nazm_kavi_id = ?
		 ORDER BY surah_number, verse_number`,
		[id]
	);

	return { ...items[0], verses };
}

/**
 * Get all nazm-kavi items for a given course filtered by type.
 */
export async function getNazmKaviItemsByType(
	courseId: number,
	type: string
): Promise<NazmKaviItemRow[]> {
	const db = getDb();
	return db.query<NazmKaviItemRow>(
		`SELECT id, course_id, type, title, description, created_at, sync_version
		 FROM NAZM_KAVI_ITEM
		 WHERE course_id = ? AND type = ?
		 ORDER BY created_at`,
		[courseId, type]
	);
}

/**
 * Insert a new nazm-kavi item. Returns the new item's ID.
 */
export async function insertNazmKaviItem(
	courseId: number,
	type: string,
	title: string,
	description?: string
): Promise<number> {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO NAZM_KAVI_ITEM (course_id, type, title, description)
		 VALUES (?, ?, ?, ?)`,
		[courseId, type, title, description ?? null]
	);
	return result.lastInsertRowId;
}

/**
 * Update an existing nazm-kavi item's type, title, or description.
 */
export async function updateNazmKaviItem(
	id: number,
	data: { type?: string; title?: string; description?: string }
): Promise<void> {
	const db = getDb();
	const sets: string[] = [];
	const params: unknown[] = [];

	if (data.type !== undefined) {
		sets.push('type = ?');
		params.push(data.type);
	}
	if (data.title !== undefined) {
		sets.push('title = ?');
		params.push(data.title);
	}
	if (data.description !== undefined) {
		sets.push('description = ?');
		params.push(data.description);
	}

	if (sets.length === 0) return;

	params.push(id);
	await db.run(`UPDATE NAZM_KAVI_ITEM SET ${sets.join(', ')} WHERE id = ?`, params);
}

/**
 * Delete a nazm-kavi item and all its associated verses.
 */
export async function deleteNazmKaviItem(id: number): Promise<void> {
	const db = getDb();
	await db.run('DELETE FROM NAZM_KAVI_VERSE WHERE nazm_kavi_id = ?', [id]);
	await db.run('DELETE FROM NAZM_KAVI_ITEM WHERE id = ?', [id]);
}

/**
 * Replace all verse assignments for a nazm-kavi item.
 * Deletes existing verses and inserts the new set.
 */
export async function setNazmKaviVerses(
	nazmKaviId: number,
	verses: { surahNumber: number; verseNumber: number }[]
): Promise<void> {
	const db = getDb();
	await db.run('DELETE FROM NAZM_KAVI_VERSE WHERE nazm_kavi_id = ?', [nazmKaviId]);
	for (const v of verses) {
		await db.run(
			'INSERT INTO NAZM_KAVI_VERSE (nazm_kavi_id, surah_number, verse_number) VALUES (?, ?, ?)',
			[nazmKaviId, v.surahNumber, v.verseNumber]
		);
	}
}
