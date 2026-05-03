<script lang="ts">
	import { t } from '$lib/i18n';
	import type { ShabakeKaviConnectionRow } from '$lib/data/repositories/shabake-kavi-repository';

	let {
		connection,
		onnavigate,
		onedit,
		ondelete
	}: {
		connection: ShabakeKaviConnectionRow;
		onnavigate: (conn: ShabakeKaviConnectionRow) => void;
		onedit: (conn: ShabakeKaviConnectionRow) => void;
		ondelete: (id: number) => void;
	} = $props();

	const typeKey = `shabake_kavi.type.${connection.target_type}` as const;
</script>

<div class="rounded-md border border-border p-3 space-y-2">
	<div class="flex items-center gap-2 flex-wrap">
		<span class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
			{t(typeKey)}
		</span>
		<span class="font-medium text-sm flex-1">{connection.title}</span>
	</div>

	{#if connection.description}
		<p class="text-xs text-muted-foreground">{connection.description}</p>
	{/if}

	<div class="text-xs text-muted-foreground">
		{connection.target_reference}
	</div>

	<div class="flex gap-2 flex-wrap">
		{#if connection.target_type === 'verse'}
			<button
				type="button"
				class="text-xs text-primary hover:text-primary/80"
				onclick={() => onnavigate(connection)}
			>
				{t('shabake_kavi.navigate')}
			</button>
		{/if}
		<button
			type="button"
			class="text-xs text-muted-foreground hover:text-foreground"
			onclick={() => onedit(connection)}
		>
			{t('shabake_kavi.edit')}
		</button>
		<button
			type="button"
			class="text-xs text-destructive hover:text-destructive/80"
			onclick={() => ondelete(connection.id)}
		>
			{t('shabake_kavi.delete')}
		</button>
	</div>
</div>
