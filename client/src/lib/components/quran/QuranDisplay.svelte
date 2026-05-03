<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { getSelection } from '$lib/state/selection-context.svelte';
	import { loadSurah, loadSurahVerses } from '$lib/services/quran-service';
	import { shouldShowBismillah } from '$lib/utils/quran-utils';
	import type { SurahInfo, Verse } from '$lib/data/repositories/quran-repository';
	import SurahHeader from './SurahHeader.svelte';
	import Bismillah from './Bismillah.svelte';
	import VerseList from './VerseList.svelte';

	let selection = $derived(getSelection());

	let surah = $state<SurahInfo | null>(null);
	let verses = $state<Verse[]>([]);
	let loading = $state(false);

	let showBismillah = $derived(surah ? shouldShowBismillah(surah.number) : false);

	$effect(() => {
		const surahNumber = selection.surahNumber;
		loadData(surahNumber);
	});

	async function loadData(surahNumber: number) {
		loading = true;
		try {
			const [surahData, versesData] = await Promise.all([
				loadSurah(surahNumber),
				loadSurahVerses(surahNumber)
			]);
			surah = surahData;
			verses = versesData;
		} catch (e) {
			console.error('Failed to load Surah data:', e);
			surah = null;
			verses = [];
		} finally {
			loading = false;
		}
	}

	function handleVerseClick(verse: Verse) {
		goto(`/surah/${verse.surahNumber}/verse/${verse.verseNumber}`);
	}
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	{#if loading}
		<div class="flex items-center justify-center h-full text-muted-foreground">
			{t('app.loading')}
		</div>
	{:else if surah}
		<SurahHeader {surah} />

		{#if showBismillah}
			<Bismillah />
		{/if}

		<VerseList
			{verses}
			selectedVerseNumber={selection.verseNumber}
			onverseclick={handleVerseClick}
		/>
	{:else}
		<div class="flex items-center justify-center h-full text-muted-foreground">
			{t('quran.select_surah')}
		</div>
	{/if}
</div>
