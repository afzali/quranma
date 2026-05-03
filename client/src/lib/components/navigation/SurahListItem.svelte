<script lang="ts">
	import type { SurahInfo } from '$lib/data/repositories/quran-repository';
	import { t } from '$lib/i18n';
	import { toArabicIndic } from '$lib/utils/quran-utils';

	let {
		surah,
		isActive = false,
		onclick
	}: {
		surah: SurahInfo;
		isActive?: boolean;
		onclick?: (surah: SurahInfo) => void;
	} = $props();

	function handleClick() {
		onclick?.(surah);
	}
</script>

<button
	type="button"
	class="w-full flex items-center gap-3 rounded-md px-3 py-2 text-start transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring {isActive
		? 'bg-accent font-semibold'
		: ''}"
	onclick={handleClick}
	aria-current={isActive ? 'true' : undefined}
>
	<!-- Surah number badge -->
	<span
		class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs border border-border {isActive
			? 'bg-primary text-primary-foreground border-primary'
			: 'bg-muted text-muted-foreground'}"
	>
		{toArabicIndic(surah.number)}
	</span>

	<!-- Surah info -->
	<div class="flex-1 min-w-0">
		<!-- Arabic name — always RTL -->
		<div lang="ar" dir="rtl" class="text-sm font-medium truncate">
			{surah.nameArabic}
		</div>
		<!-- Transliterated name -->
		<div class="text-xs text-muted-foreground truncate">
			{surah.nameEnglish}
		</div>
	</div>

	<!-- Verse count -->
	<span class="flex-shrink-0 text-xs text-muted-foreground">
		{surah.verseCount} {t('quran.verses')}
	</span>
</button>
