<script lang="ts">
	import { t } from '$lib/i18n';
	import type { NazmKaviItemRow } from '$lib/data/repositories/nazm-kavi-repository';

	const TYPES = ['repetition', 'contrast', 'axis', 'pattern'] as const;

	let {
		editingItem = null,
		onsave,
		oncancel
	}: {
		editingItem?: NazmKaviItemRow | null;
		onsave: (data: {
			id?: number;
			type: string;
			title: string;
			description: string;
			verses: string;
		}) => void;
		oncancel: () => void;
	} = $props();

	let type = $state(editingItem?.type ?? 'repetition');
	let title = $state(editingItem?.title ?? '');
	let description = $state(editingItem?.description ?? '');
	let versesInput = $state('');

	$effect(() => {
		type = editingItem?.type ?? 'repetition';
		title = editingItem?.title ?? '';
		description = editingItem?.description ?? '';
		versesInput = '';
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;
		onsave({
			id: editingItem?.id,
			type,
			title: title.trim(),
			description: description.trim(),
			verses: versesInput.trim()
		});
	}
</script>

<form class="rounded-md border border-border p-3 space-y-2" onsubmit={handleSubmit}>
	<div>
		<label class="text-xs text-muted-foreground" for="nk-type">{t('nazm_kavi.type')}</label>
		<select
			id="nk-type"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={type}
		>
			{#each TYPES as tp}
				<option value={tp}>{t(`nazm_kavi.type.${tp}`)}</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="nk-title">{t('nazm_kavi.title')}</label>
		<input
			id="nk-title"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={title}
			required
		/>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="nk-desc">{t('nazm_kavi.description')}</label>
		<input
			id="nk-desc"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={description}
		/>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="nk-verses">{t('nazm_kavi.verses')}</label>
		<input
			id="nk-verses"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			placeholder="1:1, 1:2, 2:5"
			bind:value={versesInput}
		/>
	</div>
	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
		>
			{t('nazm_kavi.save')}
		</button>
		<button
			type="button"
			class="rounded-md border border-input px-3 py-1 text-xs hover:bg-accent"
			onclick={oncancel}
		>
			{t('nazm_kavi.cancel')}
		</button>
	</div>
</form>
