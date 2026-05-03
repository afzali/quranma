<script lang="ts">
	import { t } from '$lib/i18n';
	import type { WordWithTranslation } from '$lib/data/repositories/quran-repository';
	import type { UserWordDataRow } from '$lib/data/repositories/word-data-repository';

	let {
		word,
		userData,
		onupdate
	}: {
		word: WordWithTranslation;
		userData: UserWordDataRow | null;
		onupdate: (
			wordPosition: number,
			data: { personalMeaning?: string; selectedMeaning?: string; note?: string }
		) => void;
	} = $props();

	let personalMeaning = $state(userData?.personal_meaning ?? '');
	let selectedMeaning = $state(userData?.selected_meaning ?? '');
	let note = $state(userData?.note ?? '');

	// Sync when userData changes externally (e.g. course switch)
	$effect(() => {
		personalMeaning = userData?.personal_meaning ?? '';
		selectedMeaning = userData?.selected_meaning ?? '';
		note = userData?.note ?? '';
	});

	function handleBlur(field: 'personalMeaning' | 'selectedMeaning' | 'note', value: string) {
		const trimmed = value.trim();
		const currentVal =
			field === 'personalMeaning'
				? userData?.personal_meaning
				: field === 'selectedMeaning'
					? userData?.selected_meaning
					: userData?.note;
		if (trimmed !== (currentVal ?? '')) {
			onupdate(word.position, { [field]: trimmed || undefined });
		}
	}
</script>

<div class="rounded-md border border-border p-3 space-y-2">
	<!-- Arabic word and root -->
	<div class="flex items-baseline justify-between gap-2">
		<span lang="ar" dir="rtl" class="text-lg font-semibold">{word.textArabic}</span>
		{#if word.root}
			<span class="text-xs text-muted-foreground">
				{t('word.root')}: <span lang="ar" dir="rtl">{word.root}</span>
			</span>
		{/if}
	</div>

	<!-- Default meanings -->
	{#if word.meaningFa || word.meaningEn}
		<div class="text-sm text-muted-foreground space-y-0.5">
			{#if word.meaningFa}
				<p dir="rtl">{word.meaningFa}</p>
			{/if}
			{#if word.meaningEn}
				<p dir="ltr">{word.meaningEn}</p>
			{/if}
		</div>
	{/if}

	<!-- Editable fields -->
	<div class="space-y-1.5">
		<div>
			<label class="text-xs text-muted-foreground" for="pm-{word.position}">
				{t('word.personal_meaning')}
			</label>
			<input
				id="pm-{word.position}"
				type="text"
				class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
				bind:value={personalMeaning}
				onblur={() => handleBlur('personalMeaning', personalMeaning)}
			/>
		</div>
		<div>
			<label class="text-xs text-muted-foreground" for="sm-{word.position}">
				{t('word.selected_meaning')}
			</label>
			<input
				id="sm-{word.position}"
				type="text"
				class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
				bind:value={selectedMeaning}
				onblur={() => handleBlur('selectedMeaning', selectedMeaning)}
			/>
		</div>
		<div>
			<label class="text-xs text-muted-foreground" for="wn-{word.position}">
				{t('word.note')}
			</label>
			<input
				id="wn-{word.position}"
				type="text"
				class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
				bind:value={note}
				onblur={() => handleBlur('note', note)}
			/>
		</div>
	</div>
</div>
