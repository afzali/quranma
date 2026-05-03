/**
 * Quran utility functions — numeral conversion, verse key formatting,
 * and Bismillah display logic.
 */

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Convert a number to Arabic-Indic numeral string.
 * e.g. 42 → "٤٢"
 */
export function toArabicIndic(n: number): string {
	return String(n)
		.split('')
		.map((ch) => ARABIC_INDIC_DIGITS[parseInt(ch, 10)] ?? ch)
		.join('');
}

/**
 * Format a verse key string, e.g. verseKey(2, 255) → "2:255"
 */
export function verseKey(surahNumber: number, verseNumber: number): string {
	return `${surahNumber}:${verseNumber}`;
}

/**
 * Determine whether the Bismillah should be shown for a given Surah.
 * Bismillah is shown for all Surahs except Surah 9 (At-Tawbah).
 */
export function shouldShowBismillah(surahNumber: number): boolean {
	return surahNumber !== 9;
}
