import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface CourseRow {
	id: number;
	name: string;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get all courses ordered by creation date.
 */
export async function getAllCourses(): Promise<CourseRow[]> {
	const db = getDb();
	return db.query<CourseRow>(
		'SELECT id, name, avatar_url, created_at, updated_at FROM COURSE ORDER BY created_at'
	);
}

/**
 * Get a single course by ID.
 */
export async function getCourseById(id: number): Promise<CourseRow | null> {
	const db = getDb();
	const rows = await db.query<CourseRow>(
		'SELECT id, name, avatar_url, created_at, updated_at FROM COURSE WHERE id = ?',
		[id]
	);
	return rows.length > 0 ? rows[0] : null;
}

/**
 * Insert a new course and return its ID.
 */
export async function insertCourse(name: string, avatarUrl?: string): Promise<number> {
	const db = getDb();
	const result = await db.run(
		'INSERT INTO COURSE (name, avatar_url) VALUES (?, ?)',
		[name, avatarUrl ?? null]
	);
	return result.lastInsertRowId;
}

/**
 * Update a course's name.
 */
export async function updateCourseName(id: number, name: string): Promise<void> {
	const db = getDb();
	await db.run(
		"UPDATE COURSE SET name = ?, updated_at = datetime('now') WHERE id = ?",
		[name, id]
	);
}

/**
 * Update a course's avatar URL.
 */
export async function updateCourseAvatar(id: number, avatarUrl: string): Promise<void> {
	const db = getDb();
	await db.run(
		"UPDATE COURSE SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?",
		[avatarUrl, id]
	);
}

/**
 * Get the total number of courses.
 */
export async function getCourseCount(): Promise<number> {
	const db = getDb();
	const rows = await db.query<{ cnt: number }>('SELECT COUNT(*) as cnt FROM COURSE');
	return rows.length > 0 ? rows[0].cnt : 0;
}

/**
 * Delete a course and all associated data (bookmarks, topics, topic_verses, settings).
 * Deletes in correct order to respect foreign key constraints.
 */
export async function deleteCourseAndData(id: number): Promise<void> {
	const db = getDb();
	// Delete TOPIC_VERSE records for topics belonging to this course
	await db.run(
		'DELETE FROM TOPIC_VERSE WHERE topic_id IN (SELECT id FROM TOPIC WHERE course_id = ?)',
		[id]
	);
	// Delete topics
	await db.run('DELETE FROM TOPIC WHERE course_id = ?', [id]);
	// Delete bookmarks
	await db.run('DELETE FROM BOOKMARK WHERE course_id = ?', [id]);
	// Delete course settings
	await db.run('DELETE FROM COURSE_SETTINGS WHERE course_id = ?', [id]);
	// Delete the course itself
	await db.run('DELETE FROM COURSE WHERE id = ?', [id]);
}

/**
 * Duplicate a course and all its associated data (bookmarks, topics, topic_verses, settings).
 * Returns the new course's ID.
 */
export async function duplicateCourse(sourceId: number, newName: string): Promise<number> {
	const db = getDb();

	// Insert new course
	const courseResult = await db.run(
		'INSERT INTO COURSE (name, avatar_url) SELECT ?, avatar_url FROM COURSE WHERE id = ?',
		[newName, sourceId]
	);
	const newCourseId = courseResult.lastInsertRowId;

	// Copy bookmarks
	await db.run(
		`INSERT INTO BOOKMARK (course_id, surah_number, verse_number, label, note, sync_version)
		 SELECT ?, surah_number, verse_number, label, note, 0
		 FROM BOOKMARK WHERE course_id = ?`,
		[newCourseId, sourceId]
	);

	// Copy topics and track old→new ID mapping
	const oldTopics = await db.query<{ id: number; name: string; description: string | null }>(
		'SELECT id, name, description FROM TOPIC WHERE course_id = ?',
		[sourceId]
	);

	for (const oldTopic of oldTopics) {
		const topicResult = await db.run(
			'INSERT INTO TOPIC (course_id, name, description, sync_version) VALUES (?, ?, ?, 0)',
			[newCourseId, oldTopic.name, oldTopic.description]
		);
		const newTopicId = topicResult.lastInsertRowId;

		// Copy topic verses
		await db.run(
			`INSERT INTO TOPIC_VERSE (topic_id, surah_number, verse_number)
			 SELECT ?, surah_number, verse_number
			 FROM TOPIC_VERSE WHERE topic_id = ?`,
			[newTopicId, oldTopic.id]
		);
	}

	// Copy course settings
	await db.run(
		`INSERT INTO COURSE_SETTINGS (course_id, default_translation_id, last_surah, last_verse)
		 SELECT ?, default_translation_id, last_surah, last_verse
		 FROM COURSE_SETTINGS WHERE course_id = ?`,
		[newCourseId, sourceId]
	);

	return newCourseId;
}
