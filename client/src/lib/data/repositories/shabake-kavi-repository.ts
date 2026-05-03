import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface ShabakeKaviConnectionRow {
	id: number;
	course_id: number;
	source_surah: number;
	source_verse: number;
	target_type: string;
	target_reference: string;
	title: string;
	description: string | null;
	created_at: string;
	sync_version: number;
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get all connections originating from a specific verse in a course.
 */
export async function getConnectionsForVerse(
	courseId: number,
	surahNumber: number,
	verseNumber: number
): Promise<ShabakeKaviConnectionRow[]> {
	const db = getDb();
	return db.query<ShabakeKaviConnectionRow>(
		`SELECT id, course_id, source_surah, source_verse, target_type,
		        target_reference, title, description, created_at, sync_version
		 FROM SHABAKE_KAVI_CONNECTION
		 WHERE course_id = ? AND source_surah = ? AND source_verse = ?
		 ORDER BY created_at`,
		[courseId, surahNumber, verseNumber]
	);
}

/**
 * Get connections for a verse filtered by target type.
 */
export async function getConnectionsByType(
	courseId: number,
	surahNumber: number,
	verseNumber: number,
	targetType: string
): Promise<ShabakeKaviConnectionRow[]> {
	const db = getDb();
	return db.query<ShabakeKaviConnectionRow>(
		`SELECT id, course_id, source_surah, source_verse, target_type,
		        target_reference, title, description, created_at, sync_version
		 FROM SHABAKE_KAVI_CONNECTION
		 WHERE course_id = ? AND source_surah = ? AND source_verse = ? AND target_type = ?
		 ORDER BY created_at`,
		[courseId, surahNumber, verseNumber, targetType]
	);
}

/**
 * Insert a new connection. Returns the new connection's ID.
 */
export async function insertConnection(
	courseId: number,
	data: {
		source_surah: number;
		source_verse: number;
		target_type: string;
		target_reference: string;
		title: string;
		description?: string;
	}
): Promise<number> {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO SHABAKE_KAVI_CONNECTION
		   (course_id, source_surah, source_verse, target_type, target_reference, title, description)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			courseId,
			data.source_surah,
			data.source_verse,
			data.target_type,
			data.target_reference,
			data.title,
			data.description ?? null
		]
	);
	return result.lastInsertRowId;
}

/**
 * Update an existing connection's fields.
 */
export async function updateConnection(
	id: number,
	data: Partial<
		Pick<
			ShabakeKaviConnectionRow,
			'target_type' | 'target_reference' | 'title' | 'description'
		>
	>
): Promise<void> {
	const db = getDb();
	const sets: string[] = [];
	const params: unknown[] = [];

	if (data.target_type !== undefined) {
		sets.push('target_type = ?');
		params.push(data.target_type);
	}
	if (data.target_reference !== undefined) {
		sets.push('target_reference = ?');
		params.push(data.target_reference);
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
	await db.run(
		`UPDATE SHABAKE_KAVI_CONNECTION SET ${sets.join(', ')} WHERE id = ?`,
		params
	);
}

/**
 * Delete a connection by ID.
 */
export async function deleteConnection(id: number): Promise<void> {
	const db = getDb();
	await db.run('DELETE FROM SHABAKE_KAVI_CONNECTION WHERE id = ?', [id]);
}
