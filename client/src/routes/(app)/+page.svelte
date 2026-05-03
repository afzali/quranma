<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSelection } from '$lib/state/selection-context.svelte';
	import { onMount } from 'svelte';

	// On mount, redirect to the last saved selection (restored in root layout)
	// or default to /surah/1
	onMount(() => {
		const sel = getSelection();
		if (sel.verseNumber !== null) {
			goto(`/surah/${sel.surahNumber}/verse/${sel.verseNumber}`, { replaceState: true });
		} else {
			goto(`/surah/${sel.surahNumber}`, { replaceState: true });
		}
	});
</script>
