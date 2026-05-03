<script lang="ts">
	import { t } from '$lib/i18n';
	import type { SiyaqGroupWithVerses } from '$lib/data/repositories/siyaq-repository';

	let {
		group,
		onedit,
		ondelete
	}: {
		group: SiyaqGroupWithVerses;
		onedit: (group: SiyaqGroupWithVerses) => void;
		ondelete: (id: number) => void;
	} = $props();
</script>

<div class="rounded-md border border-border p-3 space-y-2">
	<div class="flex items-center gap-2">
		<span
			class="inline-block w-4 h-4 rounded-full shrink-0 border border-border"
			style="background-color: {group.color}"
		></span>
		<span class="font-medium text-sm flex-1">{group.title}</span>
		<button
			type="button"
			class="text-xs text-muted-foreground hover:text-foreground"
			onclick={() => onedit(group)}
		>
			{t('siyaq.edit')}
		</button>
		<button
			type="button"
			class="text-xs text-destructive hover:text-destructive/80"
			onclick={() => ondelete(group.id)}
		>
			{t('siyaq.delete')}
		</button>
	</div>

	{#if group.description}
		<p class="text-xs text-muted-foreground">{group.description}</p>
	{/if}

	{#if group.verses.length > 0}
		<div class="text-xs text-muted-foreground">
			{t('siyaq.verses')}: {group.verses.map((v) => v.verse_number).join(', ')}
		</div>
	{/if}
</div>
