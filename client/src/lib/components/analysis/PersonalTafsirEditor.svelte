<script lang="ts">
	import { t } from '$lib/i18n';
	import type { UserTafsirRow } from '$lib/data/repositories/tafsir-repository';

	let {
		userTafsir,
		onsave
	}: {
		userTafsir: UserTafsirRow | null;
		onsave: (data: { personalTafsir?: string; note?: string }) => void;
	} = $props();

	let personalTafsir = $state(userTafsir?.personal_tafsir ?? '');
	let note = $state(userTafsir?.note ?? '');

	$effect(() => {
		personalTafsir = userTafsir?.personal_tafsir ?? '';
		note = userTafsir?.note ?? '';
	});

	function handleBlur() {
		const pt = personalTafsir.trim();
		const n = note.trim();
		const currentPt = userTafsir?.personal_tafsir ?? '';
		const currentNote = userTafsir?.note ?? '';
		if (pt !== currentPt || n !== currentNote) {
			onsave({
				personalTafsir: pt || undefined,
				note: n || undefined
			});
		}
	}
</script>

<div class="space-y-2">
	<div>
		<label class="text-xs text-muted-foreground" for="personal-tafsir">
			{t('tafsir.personal')}
		</label>
		<textarea
			id="personal-tafsir"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm min-h-[60px] resize-y"
			bind:value={personalTafsir}
			onblur={handleBlur}
		></textarea>
	</div>
	<div>
		<label class="text-xs text-muted-foreground" for="tafsir-note">
			{t('tafsir.note')}
		</label>
		<input
			id="tafsir-note"
			type="text"
			class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
			bind:value={note}
			onblur={handleBlur}
		/>
	</div>
</div>
