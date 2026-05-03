<script lang="ts">
	import { page } from '$app/state';
	import { setSelectionFromUrl } from '$lib/state/selection-context.svelte';

	// Reactively read the surahNumber param and update selection
	$effect(() => {
		const surahNumber = Number(page.params.surahNumber);
		if (!isNaN(surahNumber) && surahNumber >= 1 && surahNumber <= 114) {
			setSelectionFromUrl(surahNumber, null);
		}
	});
</script>
