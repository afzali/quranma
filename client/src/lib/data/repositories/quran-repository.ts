import { getDb } from '../database';

// ── Public types ──────────────────────────────────────────────

export interface SurahInfo {
	number: number;
	nameArabic: string;
	nameFarsi: string;
	nameEnglish: string;
	verseCount: number;
	revelationType: 'meccan' | 'medinan';
	revelationOrder: number | null;
	juzNumber: number | null;
	pageNumber: number | null;
}

export interface Verse {
	id: number;
	surahNumber: number;
	verseNumber: number;
	textOriginal: string;
	textSimple: string;
	textClean: string;
	pageId: number | null;
	juzId: number | null;
}

export interface Word {
	id: number;
	ayahId: number;
	surahId: number;
	ayahNumber: number;
	position: number;
	textArabic: string;
	root: string | null;
	wordType: number | null;
	wordCount: number | null;
}

export interface WordWithTranslation extends Word {
	meaningFa: string | null;
	meaningEn: string | null;
}

// ── Raw row shapes from the bundled quranoma.db ───────────────

interface SurahRow {
	id: number;
	name_ar: string;
	name_fa: string;
	name_en: string;
	revelation_type: number; // 0 = meccan, 1 = medinan
	revelation_order: number | null;
	ayah_count: number;
	juz_number: number | null;
	page_number: number | null;
}

interface AyahRow {
	id: number;
	surah_id: number;
	ayah_number: number;
	text_original: string;
	text_simple: string;
	text_clean: string;
	page_id: number | null;
	juz_id: number | null;
}

interface WordRow {
	id: number;
	ayah_id: number;
	surah_id: number;
	ayah_number: number;
	word_position: number;
	text_ar: string;
	root: string | null;
	word_type: number | null;
	word_count: number | null;
}

interface WordWithTranslationRow extends WordRow {
	meaning_fa: string | null;
	meaning_en: string | null;
}

// ── Repository functions ──────────────────────────────────────

/**
 * Get the list of all 114 Surahs ordered by number.
 */
export async function getSurahList(): Promise<SurahInfo[]> {
	const db = getDb();
	const rows = await db.query<SurahRow>(
		'SELECT id, name_ar, name_fa, name_en, revelation_type, revelation_order, ayah_count, juz_number, page_number FROM surah ORDER BY id'
	);
	return rows.map(mapSurahRow);
}

/**
 * Get a single Surah by its number.
 */
export async function getSurah(surahNumber: number): Promise<SurahInfo | null> {
	const db = getDb();
	const rows = await db.query<SurahRow>(
		'SELECT id, name_ar, name_fa, name_en, revelation_type, revelation_order, ayah_count, juz_number, page_number FROM surah WHERE id = ?',
		[surahNumber]
	);
	return rows.length > 0 ? mapSurahRow(rows[0]) : null;
}

/**
 * Get all verses for a given Surah, ordered by verse number.
 */
export async function getSurahVerses(surahNumber: number): Promise<Verse[]> {
	const db = getDb();
	const rows = await db.query<AyahRow>(
		'SELECT id, surah_id, ayah_number, text_original, text_simple, text_clean, page_id, juz_id FROM ayah WHERE surah_id = ? ORDER BY ayah_number',
		[surahNumber]
	);
	return rows.map(mapAyahRow);
}

/**
 * Get a single verse by Surah number and verse number.
 * Returns null if the verse is not found.
 */
export async function getVerse(
	surahNumber: number,
	verseNumber: number
): Promise<Verse | null> {
	const db = getDb();
	const rows = await db.query<AyahRow>(
		'SELECT id, surah_id, ayah_number, text_original, text_simple, text_clean, page_id, juz_id FROM ayah WHERE surah_id = ? AND ayah_number = ?',
		[surahNumber, verseNumber]
	);
	return rows.length > 0 ? mapAyahRow(rows[0]) : null;
}

/**
 * Get all words for a given verse, ordered by position.
 * Includes Persian and English translations via LEFT JOINs.
 */
export async function getVerseWords(
	surahNumber: number,
	verseNumber: number
): Promise<WordWithTranslation[]> {
	const db = getDb();
	const rows = await db.query<WordWithTranslationRow>(
		`SELECT
			w.id, w.ayah_id, w.surah_id, w.ayah_number, w.word_position,
			w.text_ar, w.root, w.word_type, w.word_count,
			wt_fa.meaning AS meaning_fa,
			wt_en.meaning AS meaning_en
		FROM word w
		LEFT JOIN word_translation wt_fa ON w.id = wt_fa.word_id AND wt_fa.language = 'fa'
		LEFT JOIN word_translation wt_en ON w.id = wt_en.word_id AND wt_en.language = 'en'
		WHERE w.surah_id = ? AND w.ayah_number = ?
		ORDER BY w.word_position`,
		[surahNumber, verseNumber]
	);
	return rows.map(mapWordWithTranslationRow);
}

// ── Mappers ───────────────────────────────────────────────────

function mapSurahRow(row: SurahRow): SurahInfo {
	return {
		number: row.id,
		nameArabic: row.name_ar,
		nameFarsi: row.name_fa,
		nameEnglish: row.name_en,
		verseCount: row.ayah_count,
		revelationType: row.revelation_type === 1 ? 'medinan' : 'meccan',
		revelationOrder: row.revelation_order,
		juzNumber: row.juz_number,
		pageNumber: row.page_number
	};
}

function mapAyahRow(row: AyahRow): Verse {
	return {
		id: row.id,
		surahNumber: row.surah_id,
		verseNumber: row.ayah_number,
		textOriginal: row.text_original,
		textSimple: row.text_simple ?? '',
		textClean: row.text_clean ?? '',
		pageId: row.page_id,
		juzId: row.juz_id
	};
}

function mapWordWithTranslationRow(row: WordWithTranslationRow): WordWithTranslation {
	return {
		id: row.id,
		ayahId: row.ayah_id,
		surahId: row.surah_id,
		ayahNumber: row.ayah_number,
		position: row.word_position,
		textArabic: row.text_ar,
		root: row.root,
		wordType: row.word_type,
		wordCount: row.word_count,
		meaningFa: row.meaning_fa,
		meaningEn: row.meaning_en
	};
}
