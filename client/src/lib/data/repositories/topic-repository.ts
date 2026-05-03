import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

export interface TopicRow {
	id: number;
	course_id: number;
	name: string;
	description: string | null;
	created_at: string;
}

export interface TopicVerseInfo {
	surahNumber: number;
	verseNumber: number;
	surahNameArabic: string;
}

export interface TopicWithVerses extends TopicRow {
	verses: TopicVerseInfo[];
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get all topics for a course, ordered by creation date.
 */
export async function getTopicsByCourse(courseId: number): Promise<TopicRow[]> {
	const db = getDb();
	return db.query<TopicRow>(
		`SELECT id, course_id, name, description, created_at
		 FROM TOPIC WHERE course_id = ?
		 ORDER BY created_at`,
		[courseId]
	);
}

/**
 * Insert a new topic. Returns the new topic's ID.
 */
export async function insertTopic(
	courseId: number,
	name: string,
	description?: string
): Promise<number> {
	const db = getDb();
	const result = await db.run(
		'INSERT INTO TOPIC (course_id, name, description) VALUES (?, ?, ?)',
		[courseId, name, description ?? null]
	);
	return result.lastInsertRowId;
}

/**
 * Update a topic's name.
 */
export async function updateTopicName(id: number, name: string): Promise<void> {
	const db = getDb();
	await db.run('UPDATE TOPIC SET name = ? WHERE id = ?', [name, id]);
}

/**
 * Update a topic's description.
 */
export async function updateTopicDescription(id: number, description: string): Promise<void> {
	const db = getDb();
	await db.run('UPDATE TOPIC SET description = ? WHERE id = ?', [description, id]);
}

/**
 * Delete a topic and all its verse assignments.
 */
export async function deleteTopic(id: number): Promise<void> {
	const db = getDb();
	await db.run('DELETE FROM TOPIC_VERSE WHERE topic_id = ?', [id]);
	await db.run('DELETE FROM TOPIC WHERE id = ?', [id]);
}

/**
 * Add a verse to a topic.
 */
export async function addVerseToTopic(
	topicId: number,
	surahNumber: number,
	verseNumber: number
): Promise<void> {
	const db = getDb();
	await db.run(
		'INSERT INTO TOPIC_VERSE (topic_id, surah_number, verse_number) VALUES (?, ?, ?)',
		[topicId, surahNumber, verseNumber]
	);
}

/**
 * Remove a verse from a topic.
 */
export async function removeVerseFromTopic(
	topicId: number,
	surahNumber: number,
	verseNumber: number
): Promise<void> {
	const db = getDb();
	await db.run(
		'DELETE FROM TOPIC_VERSE WHERE topic_id = ? AND surah_number = ? AND verse_number = ?',
		[topicId, surahNumber, verseNumber]
	);
}

/**
 * Check whether a verse is assigned to a topic.
 */
export async function isVerseInTopic(
	topicId: number,
	surahNumber: number,
	verseNumber: number
): Promise<boolean> {
	const db = getDb();
	const rows = await db.query<{ cnt: number }>(
		`SELECT COUNT(*) as cnt FROM TOPIC_VERSE
		 WHERE topic_id = ? AND surah_number = ? AND verse_number = ?`,
		[topicId, surahNumber, verseNumber]
	);
	return rows.length > 0 && rows[0].cnt > 0;
}

/**
 * Get all topics for a course with their assigned verses and Surah names.
 */
export async function getTopicsWithVerses(courseId: number): Promise<TopicWithVerses[]> {
	const db = getDb();

	// Get all topics for the course
	const topics = await db.query<TopicRow>(
		`SELECT id, course_id, name, description, created_at
		 FROM TOPIC WHERE course_id = ?
		 ORDER BY created_at`,
		[courseId]
	);

	// For each topic, get its verses with Surah names
	const result: TopicWithVerses[] = [];
	for (const topic of topics) {
		const verses = await db.query<{
			surah_number: number;
			verse_number: number;
			name_ar: string;
		}>(
			`SELECT tv.surah_number, tv.verse_number, s.name_ar
			 FROM TOPIC_VERSE tv
			 JOIN surah s ON tv.surah_number = s.id
			 WHERE tv.topic_id = ?
			 ORDER BY tv.surah_number, tv.verse_number`,
			[topic.id]
		);

		result.push({
			...topic,
			verses: verses.map((v) => ({
				surahNumber: v.surah_number,
				verseNumber: v.verse_number,
				surahNameArabic: v.name_ar
			}))
		});
	}

	return result;
}
