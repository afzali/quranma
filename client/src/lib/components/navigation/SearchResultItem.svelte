<script lang="ts">
	import type { SearchResult } from '$lib/services/search-service';
	import { toArabicIndic } from '$lib/utils/quran-utils';

	let {
		result,
		onclick
	}: {
		result: SearchResult;
		onclick?: (surahNumber: number, verseNumber: number) => void;
	} = $props();

	function handleClick() {
		onclick?.(result.surahNumber, result.verseNumber);
	}
</script>

<button
	type="button"
	class="w-full text-start rounded-md px-3 py-2 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
	onclick={handleClick}
>
	<!-- Surah name and verse number -->
	<div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
		<span lang="ar" dir="rtl">{result.surahNameArabic}</span>
		<span>-</span>
		<span>{toArabicIndic(result.verseNumber)}</span>
	</div>
	<!-- Text snippet -->
	<div lang="ar" dir="rtl" class="text-sm leading-relaxed line-clamp-2">
		{result.textSnippet}
	</div>
</button>
