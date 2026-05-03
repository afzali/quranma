import {
	getTranslationResource,
	getTafsirResource
} from '$lib/data/repositories/resource-repository';

/**
 * Download a translation resource.
 *
 * The bundled quranoma.db already contains all translation data in the
 * `translator` and `translation` tables, so this function verifies the
 * resource exists. In a future phase with remote resources, this would
 * fetch data from a download URL and store entries locally.
 */
export async function downloadTranslationResource(resourceId: number): Promise<boolean> {
	const resource = await getTranslationResource(resourceId);
	if (!resource) return false;

	// Data is already bundled in the `translation` table.
	// Future: fetch from remote URL and insert into local storage.
	return true;
}

/**
 * Download a tafsir resource.
 *
 * The bundled quranoma.db already contains all tafsir data in the
 * `tafsir_source` and `tafsir` tables, so this function verifies the
 * resource exists. In a future phase with remote resources, this would
 * fetch data from a download URL and store entries locally.
 */
export async function downloadTafsirResource(resourceId: number): Promise<boolean> {
	const resource = await getTafsirResource(resourceId);
	if (!resource) return false;

	// Data is already bundled in the `tafsir` table.
	// Future: fetch from remote URL and insert into local storage.
	return true;
}
