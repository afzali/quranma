<script lang="ts">
	import { page } from '$app/state';
	import { setSelectionFromUrl } from '$lib/state/selection-context.svelte';

	// Reactively read both params and update selection to the specific verse
	$effect(() => {
		const surahNumber = Number(page.params.surahNumber);
		const verseNumber = Number(page.params.verseNumber);
		if (
			!isNaN(surahNumber) &&
			surahNumber >= 1 &&
			surahNumber <= 114 &&
			!isNaN(verseNumber) &&
			verseNumber >= 1
		) {
			setSelectionFromUrl(surahNumber, verseNumber);
		}
	});
</script>
