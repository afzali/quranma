<script lang="ts">
	import type { Verse } from '$lib/data/repositories/quran-repository';
	import VerseItem from './VerseItem.svelte';

	let {
		verses,
		selectedVerseNumber = null,
		onverseclick
	}: {
		verses: Verse[];
		selectedVerseNumber?: number | null;
		onverseclick?: (verse: Verse) => void;
	} = $props();
</script>

<div class="flex flex-col gap-1" role="list" lang="ar" dir="rtl">
	{#each verses as verse (verse.id)}
		<div role="listitem">
			<VerseItem
				{verse}
				isSelected={selectedVerseNumber === verse.verseNumber}
				onclick={onverseclick}
			/>
		</div>
	{/each}
</div>
