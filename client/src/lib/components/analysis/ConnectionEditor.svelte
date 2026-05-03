<script lang="ts">
	import { t } from '$lib/i18n';
	import type { ShabakeKaviConnectionRow } from '$lib/data/repositories/shabake-kavi-repository';

	const TARGET_TYPES = ['verse', 'hadith', 'story', 'concept', 'external', 'video'] as const;

	let {
		editingConnection = null,
		onsave,
		oncancel
	}: {
		editingConnection?: ShabakeKaviConnectionRow | null;
		onsave: (data: {
			id?: number;
			target_type: string;
			target_reference: string;
			title: string;
			description: string;
		}) => void;
		oncancel: () => void;
	} = $props();

	let targetType = $state(editingConnection?.target_type ?? 'verse');
	let targetReference = $state(editingConnection?.target_reference ?? '');
	let title = $state(editingConnection?.title ?? '');
	let description = $state(editingConnection?.description ?? '');

	$effect(() => {
		targetType = editingConnection?.target_type ?? 'verse';
		targetReference = editingConnection?.target_reference ?? '';
		title = editingConnection?.title ?? '';
		description = editingConnection?.description ?? '';
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim() || !targetReference.trim()) return;
		onsave({
			id: editingConnection?.id,
			target_type: targetType,
			target_reference: targetReference.trim(),
			title: title.trim(),
			description: description.trim()
		});
	}
</script>

<form class="rounded-md border border-border p-3 space-y-2" onsubmit={handleSubmit}>
	<div>
		<label class="text-xs text-muted-foreground" for="sk-type">{t('shabake_kavi.target_type')}</label>
		<select
			id="sk-type"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={targetType}
		>
			{#each TARGET_TYPES as tp}
				<option value={tp}>{t(`shabake_kavi.type.${tp}`)}</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="sk-ref">{t('shabake_kavi.target_reference')}</label>
		<input
			id="sk-ref"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			placeholder={targetType === 'verse' ? '2:255' : ''}
			bind:value={targetReference}
			required
		/>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="sk-title">{t('shabake_kavi.title')}</label>
		<input
			id="sk-title"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={title}
			required
		/>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="sk-desc">{t('shabake_kavi.description')}</label>
		<input
			id="sk-desc"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={description}
		/>
	</div>
	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
		>
			{t('shabake_kavi.save')}
		</button>
		<button
			type="button"
			class="rounded-md border border-input px-3 py-1 text-xs hover:bg-accent"
			onclick={oncancel}
		>
			{t('shabake_kavi.cancel')}
		</button>
	</div>
</form>
