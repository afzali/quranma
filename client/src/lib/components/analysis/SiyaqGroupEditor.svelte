<script lang="ts">
	import { t } from '$lib/i18n';
	import type { SiyaqGroupWithVerses } from '$lib/data/repositories/siyaq-repository';

	let {
		editingGroup = null,
		onsave,
		oncancel
	}: {
		editingGroup?: SiyaqGroupWithVerses | null;
		onsave: (data: {
			id?: number;
			title: string;
			color: string;
			description: string;
			verses: string;
		}) => void;
		oncancel: () => void;
	} = $props();

	let title = $state(editingGroup?.title ?? '');
	let color = $state(editingGroup?.color ?? '#3b82f6');
	let description = $state(editingGroup?.description ?? '');
	let versesInput = $state(
		editingGroup?.verses.map((v) => v.verse_number).join(', ') ?? ''
	);

	$effect(() => {
		title = editingGroup?.title ?? '';
		color = editingGroup?.color ?? '#3b82f6';
		description = editingGroup?.description ?? '';
		versesInput = editingGroup?.verses.map((v) => v.verse_number).join(', ') ?? '';
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;
		onsave({
			id: editingGroup?.id,
			title: title.trim(),
			color,
			description: description.trim(),
			verses: versesInput.trim()
		});
	}
</script>

<form class="rounded-md border border-border p-3 space-y-2" onsubmit={handleSubmit}>
	<div>
		<label class="text-xs text-muted-foreground" for="siyaq-title">{t('siyaq.title')}</label>
		<input
			id="siyaq-title"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={title}
			required
		/>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="siyaq-color">{t('siyaq.color')}</label>
		<input
			id="siyaq-color"
			type="color"
			class="w-8 h-8 rounded border border-input cursor-pointer"
			bind:value={color}
		/>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="siyaq-desc">{t('siyaq.description')}</label>
		<input
			id="siyaq-desc"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={description}
		/>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="siyaq-verses">{t('siyaq.verses')}</label>
		<input
			id="siyaq-verses"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			placeholder="1, 2, 3"
			bind:value={versesInput}
		/>
	</div>
	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
		>
			{t('siyaq.save')}
		</button>
		<button
			type="button"
			class="rounded-md border border-input px-3 py-1 text-xs hover:bg-accent"
			onclick={oncancel}
		>
			{t('siyaq.cancel')}
		</button>
	</div>
</form>
