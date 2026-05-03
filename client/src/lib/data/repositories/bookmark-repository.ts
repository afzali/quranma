import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface BookmarkRow {
	id: number;
	course_id: number;
	surah_number: number;
	verse_number: number;
	label: string | null;
	note: string | null;
	created_at: string;
}

export interface BookmarkGroup {
	surahNumber: number;
	surahNameArabic: string;
	bookmarks: BookmarkRow[];
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get all bookmarks for a course, ordered by Surah and verse number.
 */
export async function getBookmarksByCourse(courseId: number): Promise<BookmarkRow[]> {
	const db = getDb();
	return db.query<BookmarkRow>(
		`SELECT id, course_id, surah_number, verse_number, label, note, created_at
		 FROM BOOKMARK WHERE course_id = ?
		 ORDER BY surah_number, verse_number`,
		[courseId]
	);
}

/**
 * Get bookmarks for a specific Surah within a course.
 */
export async function getBookmarksForSurah(
	courseId: number,
	surahNumber: number
): Promise<BookmarkRow[]> {
	const db = getDb();
	return db.query<BookmarkRow>(
		`SELECT id, course_id, surah_number, verse_number, label, note, created_at
		 FROM BOOKMARK WHERE course_id = ? AND surah_number = ?
		 ORDER BY verse_number`,
		[courseId, surahNumber]
	);
}

/**
 * Check whether a specific verse is bookmarked in a course.
 */
export async function isVerseBookmarked(
	courseId: number,
	surahNumber: number,
	verseNumber: number
): Promise<boolean> {
	const db = getDb();
	const rows = await db.query<{ cnt: number }>(
		`SELECT COUNT(*) as cnt FROM BOOKMARK
		 WHERE course_id = ? AND surah_number = ? AND verse_number = ?`,
		[courseId, surahNumber, verseNumber]
	);
	return rows.length > 0 && rows[0].cnt > 0;
}

/**
 * Insert a new bookmark. Returns the new bookmark's ID.
 */
export async function insertBookmark(
	courseId: number,
	surahNumber: number,
	verseNumber: number,
	label?: string,
	note?: string
): Promise<number> {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO BOOKMARK (course_id, surah_number, verse_number, label, note)
		 VALUES (?, ?, ?, ?, ?)`,
		[courseId, surahNumber, verseNumber, label ?? null, note ?? null]
	);
	return result.lastInsertRowId;
}

/**
 * Delete a bookmark by ID.
 */
export async function deleteBookmark(id: number): Promise<void> {
	const db = getDb();
	await db.run('DELETE FROM BOOKMARK WHERE id = ?', [id]);
}

/**
 * Delete a bookmark by course, surah, and verse (for toggle behavior).
 */
export async function deleteBookmarkByVerse(
	courseId: number,
	surahNumber: number,
	verseNumber: number
): Promise<void> {
	const db = getDb();
	await db.run(
		'DELETE FROM BOOKMARK WHERE course_id = ? AND surah_number = ? AND verse_number = ?',
		[courseId, surahNumber, verseNumber]
	);
}

/**
 * Get bookmarks grouped by Surah, with Arabic Surah names.
 */
export async function getBookmarksGroupedBySurah(courseId: number): Promise<BookmarkGroup[]> {
	const db = getDb();
	const rows = await db.query<BookmarkRow & { surah_name_ar: string }>(
		`SELECT b.id, b.course_id, b.surah_number, b.verse_number, b.label, b.note, b.created_at,
		        s.name_ar as surah_name_ar
		 FROM BOOKMARK b
		 JOIN surah s ON b.surah_number = s.id
		 WHERE b.course_id = ?
		 ORDER BY b.surah_number, b.verse_number`,
		[courseId]
	);

	const groups: Map<number, BookmarkGroup> = new Map();
	for (const row of rows) {
		if (!groups.has(row.surah_number)) {
			groups.set(row.surah_number, {
				surahNumber: row.surah_number,
				surahNameArabic: row.surah_name_ar,
				bookmarks: []
			});
		}
		groups.get(row.surah_number)!.bookmarks.push({
			id: row.id,
			course_id: row.course_id,
			surah_number: row.surah_number,
			verse_number: row.verse_number,
			label: row.label,
			note: row.note,
			created_at: row.created_at
		});
	}

	return Array.from(groups.values());
}

/**
 * Update a bookmark's label.
 */
export async function updateBookmarkLabel(id: number, label: string): Promise<void> {
	const db = getDb();
	await db.run('UPDATE BOOKMARK SET label = ? WHERE id = ?', [label, id]);
}

/**
 * Update a bookmark's note.
 */
export async function updateBookmarkNote(id: number, note: string): Promise<void> {
	const db = getDb();
	await db.run('UPDATE BOOKMARK SET note = ? WHERE id = ?', [note, id]);
}
