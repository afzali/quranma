<script lang="ts">
	import { t } from '$lib/i18n';
	import type { NazmKaviItemRow } from '$lib/data/repositories/nazm-kavi-repository';
	import { getActiveNazmKaviId } from '$lib/state/highlight-context.svelte';

	let {
		item,
		verses = [],
		onactivate,
		onedit,
		ondelete
	}: {
		item: NazmKaviItemRow;
		verses?: { surah_number: number; verse_number: number }[];
		onactivate: (id: number) => void;
		onedit: (item: NazmKaviItemRow) => void;
		ondelete: (id: number) => void;
	} = $props();

	let activeId = $derived(getActiveNazmKaviId());
	let isActive = $derived(activeId === item.id);

	const typeKey = `nazm_kavi.type.${item.type}` as const;
</script>

<div class="rounded-md border border-border p-3 space-y-2" class:ring-2={isActive} class:ring-primary={isActive}>
	<div class="flex items-center gap-2 flex-wrap">
		<span class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
			{t(typeKey)}
		</span>
		<span class="font-medium text-sm flex-1">{item.title}</span>
	</div>

	{#if item.description}
		<p class="text-xs text-muted-foreground">{item.description}</p>
	{/if}

	{#if verses.length > 0}
		<div class="text-xs text-muted-foreground">
			{t('nazm_kavi.verses')}: {verses.map((v) => `${v.surah_number}:${v.verse_number}`).join(', ')}
		</div>
	{/if}

	<div class="flex gap-2 flex-wrap">
		<button
			type="button"
			class="text-xs px-2 py-0.5 rounded-md {isActive
				? 'bg-primary text-primary-foreground'
				: 'border border-input hover:bg-accent'}"
			onclick={() => onactivate(item.id)}
		>
			{isActive ? t('nazm_kavi.deactivate') : t('nazm_kavi.activate')}
		</button>
		<button
			type="button"
			class="text-xs text-muted-foreground hover:text-foreground"
			onclick={() => onedit(item)}
		>
			{t('nazm_kavi.edit')}
		</button>
		<button
			type="button"
			class="text-xs text-destructive hover:text-destructive/80"
			onclick={() => ondelete(item.id)}
		>
			{t('nazm_kavi.delete')}
		</button>
	</div>
</div>
