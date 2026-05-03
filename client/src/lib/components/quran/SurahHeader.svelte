<script lang="ts">
	import type { SurahInfo } from '$lib/data/repositories/quran-repository';
	import { t } from '$lib/i18n';
	import { toArabicIndic } from '$lib/utils/quran-utils';

	let { surah }: { surah: SurahInfo } = $props();

	let revelationLabel = $derived(
		surah.revelationType === 'meccan' ? t('surah.meccan') : t('surah.medinan')
	);
</script>

<header class="flex flex-col items-center gap-2 border-b border-border pb-4 mb-4">
	<!-- Surah name in Arabic -->
	<h1 lang="ar" dir="rtl" class="text-3xl font-bold leading-relaxed">
		{surah.nameArabic}
	</h1>

	<!-- Surah metadata -->
	<div class="flex items-center gap-3 text-sm text-muted-foreground">
		<span>{toArabicIndic(surah.number)}</span>
		<span class="text-border">|</span>
		<span>{surah.verseCount} {t('quran.verses')}</span>
		<span class="text-border">|</span>
		<span>{revelationLabel}</span>
	</div>
</header>
