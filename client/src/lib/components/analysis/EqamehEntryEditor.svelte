<script lang="ts">
	import { t } from '$lib/i18n';
	import type { EqamehEntryRow } from '$lib/data/repositories/eqameh-repository';

	const TYPES = ['principle', 'duty', 'message', 'decision', 'action'] as const;

	let {
		editingEntry = null,
		onsave,
		oncancel
	}: {
		editingEntry?: EqamehEntryRow | null;
		onsave: (data: {
			id?: number;
			type: string;
			textContent: string;
			verseNumber: number | null;
		}) => void;
		oncancel: () => void;
	} = $props();

	let type = $state(editingEntry?.type ?? 'principle');
	let textContent = $state(editingEntry?.text_content ?? '');
	let verseNumberStr = $state(editingEntry?.verse_number?.toString() ?? '');

	$effect(() => {
		type = editingEntry?.type ?? 'principle';
		textContent = editingEntry?.text_content ?? '';
		verseNumberStr = editingEntry?.verse_number?.toString() ?? '';
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!textContent.trim()) return;
		const vn = verseNumberStr.trim() ? parseInt(verseNumberStr.trim(), 10) : null;
		onsave({
			id: editingEntry?.id,
			type,
			textContent: textContent.trim(),
			verseNumber: vn !== null && !isNaN(vn) ? vn : null
		});
	}
</script>

<form class="rounded-md border border-border p-3 space-y-2" onsubmit={handleSubmit}>
	<div>
		<label class="text-xs text-muted-foreground" for="eq-type">{t('eqameh.type')}</label>
		<select
			id="eq-type"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={type}
		>
			{#each TYPES as tp}
				<option value={tp}>{t(`eqameh.type.${tp}`)}</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="eq-text">{t('eqameh.text_content')}</label>
		<textarea
			id="eq-text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm min-h-[60px] resize-y"
			bind:value={textContent}
			required
		></textarea>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="eq-verse">{t('eqameh.verse_number')}</label>
		<input
			id="eq-verse"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			placeholder={t('eqameh.surah_level')}
			bind:value={verseNumberStr}
		/>
	</div>
	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
		>
			{t('eqameh.save')}
		</button>
		<button
			type="button"
			class="rounded-md border border-input px-3 py-1 text-xs hover:bg-accent"
			onclick={oncancel}
		>
			{t('eqameh.cancel')}
		</button>
	</div>
</form>
