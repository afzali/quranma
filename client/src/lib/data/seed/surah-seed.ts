import type { DatabaseAdapter } from '../database-adapter';
import surahData from './quran-data.json';

interface SurahSeedRow {
	number: number;
	name_arabic: string;
	name_transliteration: string;
	verse_count: number;
	revelation_type: string;
}

/**
 * Seed the SURAH table with metadata for all 114 Surahs.
 * Uses INSERT OR IGNORE so it's safe to run multiple times.
 */
export async function seedSurahData(adapter: DatabaseAdapter): Promise<void> {
	const rows = surahData as SurahSeedRow[];

	for (const row of rows) {
		await adapter.run(
			'INSERT OR IGNORE INTO SURAH (number, name_arabic, name_transliteration, verse_count, revelation_type) VALUES (?, ?, ?, ?, ?)',
			[row.number, row.name_arabic, row.name_transliteration, row.verse_count, row.revelation_type]
		);
	}
}
