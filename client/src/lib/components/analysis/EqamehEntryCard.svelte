<script lang="ts">
	import { t } from '$lib/i18n';
	import type { EqamehEntryRow } from '$lib/data/repositories/eqameh-repository';

	let {
		entry,
		onedit,
		ondelete
	}: {
		entry: EqamehEntryRow;
		onedit: (entry: EqamehEntryRow) => void;
		ondelete: (id: number) => void;
	} = $props();

	const typeKey = `eqameh.type.${entry.type}` as const;
	let levelLabel = $derived(
		entry.verse_number ? `${t('eqameh.verse_level')} ${entry.verse_number}` : t('eqameh.surah_level')
	);
</script>

<div class="rounded-md border border-border p-3 space-y-2">
	<div class="flex items-center gap-2 flex-wrap">
		<span class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
			{t(typeKey)}
		</span>
		<span class="text-xs text-muted-foreground">{levelLabel}</span>
	</div>

	<p class="text-sm">{entry.text_content}</p>

	<div class="flex gap-2">
		<button
			type="button"
			class="text-xs text-muted-foreground hover:text-foreground"
			onclick={() => onedit(entry)}
		>
			{t('eqameh.edit')}
		</button>
		<button
			type="button"
			class="text-xs text-destructive hover:text-destructive/80"
			onclick={() => ondelete(entry.id)}
		>
			{t('eqameh.delete')}
		</button>
	</div>
</div>
