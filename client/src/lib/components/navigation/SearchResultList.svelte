<script lang="ts">
	import type { SearchResult } from '$lib/services/search-service';
	import { t } from '$lib/i18n';
	import SearchResultItem from './SearchResultItem.svelte';

	let {
		results,
		total,
		onresultclick
	}: {
		results: SearchResult[];
		total: number;
		onresultclick?: (surahNumber: number, verseNumber: number) => void;
	} = $props();
</script>

<div class="flex flex-col h-full">
	{#if total > 0}
		<div class="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
			{t('search.result_count').replace('{count}', String(total))}
		</div>
	{/if}

	<div class="flex-1 overflow-y-auto p-1">
		{#each results as result (result.surahNumber + '-' + result.verseNumber)}
			<SearchResultItem {result} onclick={onresultclick} />
		{/each}
	</div>
</div>
