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
 * Delete a course and all associated data.
 * Deletes Phase 2 data (bookmarks, topics, topic_verses, settings)
 * and Phase 3 data (word data, translations, tafsirs, siyaq, nazm-kavi,
 * shabake-kavi, eqameh) in correct order to respect foreign key constraints.
 */
export async function deleteCourseAndData(id: number): Promise<void> {
	const db = getDb();

	// Phase 2 deletes
	await db.run(
		'DELETE FROM TOPIC_VERSE WHERE topic_id IN (SELECT id FROM TOPIC WHERE course_id = ?)',
		[id]
	);
	await db.run('DELETE FROM TOPIC WHERE course_id = ?', [id]);
	await db.run('DELETE FROM BOOKMARK WHERE course_id = ?', [id]);
	await db.run('DELETE FROM COURSE_SETTINGS WHERE course_id = ?', [id]);

	// Phase 3 deletes
	await db.run('DELETE FROM USER_WORD_DATA WHERE course_id = ?', [id]);
	await db.run('DELETE FROM USER_TRANSLATION WHERE course_id = ?', [id]);
	await db.run('DELETE FROM USER_TAFSIR WHERE course_id = ?', [id]);
	await db.run(
		'DELETE FROM SIYAQ_VERSE WHERE siyaq_group_id IN (SELECT id FROM SIYAQ_GROUP WHERE course_id = ?)',
		[id]
	);
	await db.run('DELETE FROM SIYAQ_GROUP WHERE course_id = ?', [id]);
	await db.run(
		'DELETE FROM NAZM_KAVI_VERSE WHERE nazm_kavi_id IN (SELECT id FROM NAZM_KAVI_ITEM WHERE course_id = ?)',
		[id]
	);
	await db.run('DELETE FROM NAZM_KAVI_ITEM WHERE course_id = ?', [id]);
	await db.run('DELETE FROM SHABAKE_KAVI_CONNECTION WHERE course_id = ?', [id]);
	await db.run('DELETE FROM EQAMEH_ENTRY WHERE course_id = ?', [id]);

	// Delete the course itself
	await db.run('DELETE FROM COURSE WHERE id = ?', [id]);
}

/**
 * Duplicate a course and all its associated data.
 * Copies Phase 2 data (bookmarks, topics, topic_verses, settings)
 * and Phase 3 data (word data, translations, tafsirs, siyaq groups,
 * nazm-kavi items, shabake-kavi connections, eqameh entries).
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

	// ── Phase 2 copies ────────────────────────────────────────

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

	// ── Phase 3 copies ────────────────────────────────────────

	// Copy user word data
	await db.run(
		`INSERT INTO USER_WORD_DATA (course_id, surah_number, verse_number, word_position, personal_meaning, selected_meaning, note, sync_version)
		 SELECT ?, surah_number, verse_number, word_position, personal_meaning, selected_meaning, note, 0
		 FROM USER_WORD_DATA WHERE course_id = ?`,
		[newCourseId, sourceId]
	);

	// Copy user translations
	await db.run(
		`INSERT INTO USER_TRANSLATION (course_id, surah_number, verse_number, personal_translation, note, sync_version)
		 SELECT ?, surah_number, verse_number, personal_translation, note, 0
		 FROM USER_TRANSLATION WHERE course_id = ?`,
		[newCourseId, sourceId]
	);

	// Copy user tafsirs
	await db.run(
		`INSERT INTO USER_TAFSIR (course_id, surah_number, verse_number, personal_tafsir, note, sync_version)
		 SELECT ?, surah_number, verse_number, personal_tafsir, note, 0
		 FROM USER_TAFSIR WHERE course_id = ?`,
		[newCourseId, sourceId]
	);

	// Copy siyaq groups with their verses
	const oldSiyaqGroups = await db.query<{ id: number; surah_number: number; title: string; color: string; description: string | null }>(
		'SELECT id, surah_number, title, color, description FROM SIYAQ_GROUP WHERE course_id = ?',
		[sourceId]
	);

	for (const oldGroup of oldSiyaqGroups) {
		const groupResult = await db.run(
			'INSERT INTO SIYAQ_GROUP (course_id, surah_number, title, color, description, sync_version) VALUES (?, ?, ?, ?, ?, 0)',
			[newCourseId, oldGroup.surah_number, oldGroup.title, oldGroup.color, oldGroup.description]
		);
		const newGroupId = groupResult.lastInsertRowId;

		await db.run(
			`INSERT INTO SIYAQ_VERSE (siyaq_group_id, surah_number, verse_number)
			 SELECT ?, surah_number, verse_number
			 FROM SIYAQ_VERSE WHERE siyaq_group_id = ?`,
			[newGroupId, oldGroup.id]
		);
	}

	// Copy nazm-kavi items with their verses
	const oldNazmKaviItems = await db.query<{ id: number; type: string; title: string; description: string | null }>(
		'SELECT id, type, title, description FROM NAZM_KAVI_ITEM WHERE course_id = ?',
		[sourceId]
	);

	for (const oldItem of oldNazmKaviItems) {
		const itemResult = await db.run(
			'INSERT INTO NAZM_KAVI_ITEM (course_id, type, title, description, sync_version) VALUES (?, ?, ?, ?, 0)',
			[newCourseId, oldItem.type, oldItem.title, oldItem.description]
		);
		const newItemId = itemResult.lastInsertRowId;

		await db.run(
			`INSERT INTO NAZM_KAVI_VERSE (nazm_kavi_id, surah_number, verse_number)
			 SELECT ?, surah_number, verse_number
			 FROM NAZM_KAVI_VERSE WHERE nazm_kavi_id = ?`,
			[newItemId, oldItem.id]
		);
	}

	// Copy shabake-kavi connections
	await db.run(
		`INSERT INTO SHABAKE_KAVI_CONNECTION (course_id, source_surah, source_verse, target_type, target_reference, title, description, sync_version)
		 SELECT ?, source_surah, source_verse, target_type, target_reference, title, description, 0
		 FROM SHABAKE_KAVI_CONNECTION WHERE course_id = ?`,
		[newCourseId, sourceId]
	);

	// Copy eqameh entries
	await db.run(
		`INSERT INTO EQAMEH_ENTRY (course_id, surah_number, verse_number, type, text_content, sync_version)
		 SELECT ?, surah_number, verse_number, type, text_content, 0
		 FROM EQAMEH_ENTRY WHERE course_id = ?`,
		[newCourseId, sourceId]
	);

	return newCourseId;
}
