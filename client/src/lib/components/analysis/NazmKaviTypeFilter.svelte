<script lang="ts">
	import { t } from '$lib/i18n';

	const TYPES = ['all', 'repetition', 'contrast', 'axis', 'pattern'] as const;

	let {
		activeFilter,
		onfilter
	}: {
		activeFilter: string;
		onfilter: (type: string) => void;
	} = $props();
</script>

<div class="flex flex-wrap gap-1">
	{#each TYPES as tp}
		<button
			type="button"
			class="rounded-full px-2 py-0.5 text-xs transition-colors {activeFilter === tp
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-accent'}"
			onclick={() => onfilter(tp)}
		>
			{tp === 'all' ? t('nazm_kavi.all') : t(`nazm_kavi.type.${tp}`)}
		</button>
	{/each}
</div>
