<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { loadSurahList } from '$lib/services/quran-service';
	import { getSelection } from '$lib/state/selection-context.svelte';
	import type { SurahInfo } from '$lib/data/repositories/quran-repository';
	import SurahListItem from './SurahListItem.svelte';

	let surahList = $state<SurahInfo[]>([]);
	let loading = $state(true);
	let selection = $derived(getSelection());

	$effect(() => {
		fetchSurahList();
	});

	async function fetchSurahList() {
		try {
			surahList = await loadSurahList();
		} catch (e) {
			console.error('Failed to load Surah list:', e);
			surahList = [];
		} finally {
			loading = false;
		}
	}

	function handleSurahClick(surah: SurahInfo) {
		goto(`/surah/${surah.number}`);
	}
</script>

<div class="flex flex-col h-full">
	<h2 class="px-3 py-2 text-sm font-semibold text-foreground border-b border-border">
		{t('nav.toc')}
	</h2>

	{#if loading}
		<div class="flex items-center justify-center flex-1 text-muted-foreground text-sm">
			{t('app.loading')}
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto p-1" role="list">
			{#each surahList as surah (surah.number)}
				<div role="listitem">
					<SurahListItem
						{surah}
						isActive={selection.surahNumber === surah.number}
						onclick={handleSurahClick}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>
