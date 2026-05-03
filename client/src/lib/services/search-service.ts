/**
 * Search Service — provides debounce-ready search over Quran verses.
 */

import {
	searchVersesInDb,
	type VerseSearchResult
} from '$lib/data/repositories/quran-repository';

export interface SearchResult {
	surahNumber: number;
	surahNameArabic: string;
	verseNumber: number;
	textSnippet: string;
}

export interface SearchResponse {
	items: SearchResult[];
	total: number;
}

/**
 * Search verses matching the given query.
 * Sanitizes the query and maps results to SearchResult with text snippets.
 */
export async function searchVerses(query: string): Promise<SearchResponse> {
	const trimmed = query.trim();
	if (trimmed.length === 0) {
		return { items: [], total: 0 };
	}

	const results = await searchVersesInDb(trimmed);

	const items: SearchResult[] = results.map((r: VerseSearchResult) => ({
		surahNumber: r.surahNumber,
		surahNameArabic: r.surahNameArabic,
		verseNumber: r.verseNumber,
		textSnippet: extractSnippet(r.textArabic, r.textSimple, trimmed)
	}));

	return {
		items,
		total: items.length
	};
}

/**
 * Extract a text snippet around the match.
 * Prefers textArabic if it contains the query, otherwise uses textSimple.
 */
function extractSnippet(textArabic: string, textSimple: string, query: string): string {
	// Use the text that contains the match
	const text = textArabic.includes(query) ? textArabic : textSimple;

	// If text is short enough, return it all
	if (text.length <= 120) return text;

	// Find the match position and extract a window around it
	const idx = text.indexOf(query);
	if (idx === -1) return text.substring(0, 120) + '…';

	const start = Math.max(0, idx - 40);
	const end = Math.min(text.length, idx + query.length + 40);

	let snippet = text.substring(start, end);
	if (start > 0) snippet = '…' + snippet;
	if (end < text.length) snippet = snippet + '…';

	return snippet;
}
