<script lang="ts">
	import { t } from '$lib/i18n';
	import type { UserTranslationRow } from '$lib/data/repositories/translation-repository';

	let {
		userTranslation,
		onsave
	}: {
		userTranslation: UserTranslationRow | null;
		onsave: (data: { personalTranslation?: string; note?: string }) => void;
	} = $props();

	let personalTranslation = $state(userTranslation?.personal_translation ?? '');
	let note = $state(userTranslation?.note ?? '');

	$effect(() => {
		personalTranslation = userTranslation?.personal_translation ?? '';
		note = userTranslation?.note ?? '';
	});

	function handleBlur() {
		const pt = personalTranslation.trim();
		const n = note.trim();
		const currentPt = userTranslation?.personal_translation ?? '';
		const currentNote = userTranslation?.note ?? '';
		if (pt !== currentPt || n !== currentNote) {
			onsave({
				personalTranslation: pt || undefined,
				note: n || undefined
			});
		}
	}
</script>

<div class="space-y-2">
	<div>
		<label class="text-xs text-muted-foreground" for="personal-translation">
			{t('translation.personal')}
		</label>
		<textarea
			id="personal-translation"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm min-h-[60px] resize-y"
			bind:value={personalTranslation}
			onblur={handleBlur}
		></textarea>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="translation-note">
			{t('translation.note')}
		</label>
		<input
			id="translation-note"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={note}
			onblur={handleBlur}
		/>
	</div>
</div>
