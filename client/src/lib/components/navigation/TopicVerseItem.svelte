<script lang="ts">
	import type { TopicVerseInfo } from '$lib/data/repositories/topic-repository';
	import { toArabicIndic } from '$lib/utils/quran-utils';
	import { t } from '$lib/i18n';

	let {
		verse,
		onclick,
		onremove
	}: {
		verse: TopicVerseInfo;
		onclick?: (surahNumber: number, verseNumber: number) => void;
		onremove?: (surahNumber: number, verseNumber: number) => void;
	} = $props();

	function handleClick() {
		onclick?.(verse.surahNumber, verse.verseNumber);
	}

	function handleRemove(e: Event) {
		e.stopPropagation();
		onremove?.(verse.surahNumber, verse.verseNumber);
	}
</script>

<div class="flex items-center gap-1 group">
	<button
		type="button"
		class="flex-1 min-w-0 text-start rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent/50"
		onclick={handleClick}
	>
		<span lang="ar" dir="rtl">{verse.surahNameArabic}</span>
		<span class="text-muted-foreground"> : {toArabicIndic(verse.verseNumber)}</span>
	</button>

	<button
		type="button"
		class="flex-shrink-0 p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
		onclick={handleRemove}
		aria-label={t('topic.remove_verse')}
		title={t('topic.remove_verse')}
	>
		<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M18 6 6 18" /><path d="m6 6 12 12" />
		</svg>
	</button>
</div>
