<script lang="ts">
	import type { BookmarkRow } from '$lib/data/repositories/bookmark-repository';
	import { toArabicIndic } from '$lib/utils/quran-utils';

	let {
		bookmark,
		surahNameArabic,
		onclick
	}: {
		bookmark: BookmarkRow;
		surahNameArabic: string;
		onclick?: (surahNumber: number, verseNumber: number) => void;
	} = $props();

	function handleClick() {
		onclick?.(bookmark.surah_number, bookmark.verse_number);
	}
</script>

<button
	type="button"
	class="w-full text-start rounded-md px-3 py-1.5 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
	onclick={handleClick}
>
	<div class="flex items-center gap-1.5">
		<span class="text-sm" lang="ar" dir="rtl">
			{surahNameArabic} : {toArabicIndic(bookmark.verse_number)}
		</span>
		{#if bookmark.label}
			<span class="text-xs text-muted-foreground truncate">— {bookmark.label}</span>
		{/if}
	</div>
	{#if bookmark.note}
		<div class="text-xs text-muted-foreground truncate mt-0.5">
			{bookmark.note}
		</div>
	{/if}
</button>
