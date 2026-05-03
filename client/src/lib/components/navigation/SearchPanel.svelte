<script lang="ts">
	import { searchVerses, type SearchResult } from '$lib/services/search-service';
	import { selectVerse } from '$lib/state/selection-context.svelte';
	import { t } from '$lib/i18n';
	import SearchInput from './SearchInput.svelte';
	import SearchResultList from './SearchResultList.svelte';

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let totalCount = $state(0);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		clearTimeout(debounceTimer);
		const q = query;
		if (q.trim().length > 0) {
			debounceTimer = setTimeout(async () => {
				const response = await searchVerses(q);
				results = response.items;
				totalCount = response.total;
			}, 300);
		} else {
			results = [];
			totalCount = 0;
		}
	});

	function handleResultClick(surahNumber: number, verseNumber: number) {
		selectVerse(surahNumber, verseNumber);
	}
</script>

<div class="flex flex-col h-full">
	<SearchInput bind:value={query} />

	{#if query.trim().length > 0 && totalCount === 0}
		<div class="flex items-center justify-center flex-1 text-muted-foreground text-sm">
			{t('search.no_results')}
		</div>
	{:else if totalCount > 0}
		<SearchResultList {results} total={totalCount} onresultclick={handleResultClick} />
	{/if}
</div>
