import { getDb } from '../database';

// ── Types ─────────────────────────────────────────────────────

/**
 * Represents a translation resource from the bundled `translator` table.
 */
export interface TranslationResourceRow {
	id: number;
	code: string;
	name: string;
	language: string;
	direction: string;
	source: string | null;
}

/**
 * Represents a translation entry from the bundled `translation` table.
 */
export interface TranslationEntryRow {
	id: number;
	ayah_id: number;
	translator_id: number;
	text: string;
}

/**
 * A translation entry joined with translator metadata.
 */
export interface TranslationEntryWithResource extends TranslationEntryRow {
	translator_name: string;
	translator_language: string;
}

/**
 * Represents a tafsir resource from the bundled `tafsir_source` table.
 */
export interface TafsirResourceRow {
	id: number;
	code: string;
	name_fa: string;
	name_en: string;
	name_ar: string;
	author: string;
	language: string;
}

/**
 * Represents a tafsir entry from the bundled `tafsir` table.
 */
export interface TafsirEntryRow {
	id: number;
	ayah_id: number;
	source_id: number;
	text: string;
}

/**
 * A tafsir entry joined with source metadata.
 */
export interface TafsirEntryWithResource extends TafsirEntryRow {
	source_name_fa: string;
	author: string;
}

// ── Translation Resource functions ────────────────────────────

/**
 * Get all translation resources (translators) from the bundled database.
 */
export async function getAllTranslationResources(): Promise<TranslationResourceRow[]> {
	const db = getDb();
	return db.query<TranslationResourceRow>(
		'SELECT id, code, name, language, direction, source FROM translator ORDER BY id'
	);
}

/**
 * Get a single translation resource by ID.
 */
export async function getTranslationResource(id: number): Promise<TranslationResourceRow | null> {
	const db = getDb();
	const rows = await db.query<TranslationResourceRow>(
		'SELECT id, code, name, language, direction, source FROM translator WHERE id = ?',
		[id]
	);
	return rows.length > 0 ? rows[0] : null;
}

/**
 * Get translation entries for a specific verse (by surah and verse number),
 * joining with the ayah table to resolve surah_number/verse_number
 * and with the translator table for metadata.
 */
export async function getTranslationEntriesForVerse(
	surahNumber: number,
	verseNumber: number
): Promise<TranslationEntryWithResource[]> {
	const db = getDb();
	return db.query<TranslationEntryWithResource>(
		`SELECT t.id, t.ayah_id, t.translator_id, t.text,
		        tr.name AS translator_name, tr.language AS translator_language
		 FROM translation t
		 JOIN ayah a ON t.ayah_id = a.id
		 JOIN translator tr ON t.translator_id = tr.id
		 WHERE a.surah_id = ? AND a.ayah_number = ?
		 ORDER BY tr.id`,
		[surahNumber, verseNumber]
	);
}

/**
 * Get translation entries for a specific verse from a specific translator.
 */
export async function getTranslationEntriesForVerseByTranslator(
	translatorId: number,
	surahNumber: number,
	verseNumber: number
): Promise<TranslationEntryRow[]> {
	const db = getDb();
	return db.query<TranslationEntryRow>(
		`SELECT t.id, t.ayah_id, t.translator_id, t.text
		 FROM translation t
		 JOIN ayah a ON t.ayah_id = a.id
		 WHERE t.translator_id = ? AND a.surah_id = ? AND a.ayah_number = ?`,
		[translatorId, surahNumber, verseNumber]
	);
}

// ── Tafsir Resource functions ─────────────────────────────────

/**
 * Get all tafsir resources (sources) from the bundled database.
 */
export async function getAllTafsirResources(): Promise<TafsirResourceRow[]> {
	const db = getDb();
	return db.query<TafsirResourceRow>(
		'SELECT id, code, name_fa, name_en, name_ar, author, language FROM tafsir_source ORDER BY id'
	);
}

/**
 * Get a single tafsir resource by ID.
 */
export async function getTafsirResource(id: number): Promise<TafsirResourceRow | null> {
	const db = getDb();
	const rows = await db.query<TafsirResourceRow>(
		'SELECT id, code, name_fa, name_en, name_ar, author, language FROM tafsir_source WHERE id = ?',
		[id]
	);
	return rows.length > 0 ? rows[0] : null;
}

/**
 * Get tafsir entries for a specific verse (by surah and verse number),
 * joining with the ayah table to resolve surah_number/verse_number
 * and with the tafsir_source table for metadata.
 */
export async function getTafsirEntriesForVerse(
	surahNumber: number,
	verseNumber: number
): Promise<TafsirEntryWithResource[]> {
	const db = getDb();
	return db.query<TafsirEntryWithResource>(
		`SELECT t.id, t.ayah_id, t.source_id, t.text,
		        ts.name_fa AS source_name_fa, ts.author
		 FROM tafsir t
		 JOIN ayah a ON t.ayah_id = a.id
		 JOIN tafsir_source ts ON t.source_id = ts.id
		 WHERE a.surah_id = ? AND a.ayah_number = ?
		 ORDER BY ts.id`,
		[surahNumber, verseNumber]
	);
}

/**
 * Get tafsir entries for a specific verse from a specific source.
 */
export async function getTafsirEntriesForVerseBySource(
	sourceId: number,
	surahNumber: number,
	verseNumber: number
): Promise<TafsirEntryRow[]> {
	const db = getDb();
	return db.query<TafsirEntryRow>(
		`SELECT t.id, t.ayah_id, t.source_id, t.text
		 FROM tafsir t
		 JOIN ayah a ON t.ayah_id = a.id
		 WHERE t.source_id = ? AND a.surah_id = ? AND a.ayah_number = ?`,
		[sourceId, surahNumber, verseNumber]
	);
}
