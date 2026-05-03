<script lang="ts">
	import type { Verse } from '$lib/data/repositories/quran-repository';
	import { toArabicIndic } from '$lib/utils/quran-utils';

	let {
		verse,
		isSelected = false,
		onclick
	}: {
		verse: Verse;
		isSelected?: boolean;
		onclick?: (verse: Verse) => void;
	} = $props();

	function handleClick() {
		onclick?.(verse);
	}
</script>

<button
	type="button"
	class="w-full text-start rounded-md px-3 py-2 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring {isSelected
		? 'bg-accent'
		: ''}"
	onclick={handleClick}
	aria-label="Verse {verse.verseNumber}"
	aria-pressed={isSelected}
>
	<span lang="ar" dir="rtl" class="text-xl leading-loose inline">
		{verse.textOriginal}
	</span>
	<!-- Arabic-Indic verse number marker -->
	<span
		lang="ar"
		dir="rtl"
		class="inline-flex items-center justify-center mx-1 text-sm text-muted-foreground"
		aria-label="Verse number {verse.verseNumber}"
	>
		﴿{toArabicIndic(verse.verseNumber)}﴾
	</span>
</button>
