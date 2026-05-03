<script lang="ts">
	import { t } from '$lib/i18n';
	import { getSelection, isVerseLevelSelection } from '$lib/state/selection-context.svelte';
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import {
		getAllTafsirResources,
		getTafsirEntriesForVerse,
		type TafsirResourceRow,
		type TafsirEntryWithResource
	} from '$lib/data/repositories/resource-repository';
	import {
		getUserTafsir,
		upsertUserTafsir,
		type UserTafsirRow
	} from '$lib/data/repositories/tafsir-repository';
	import TafsirResourceList from './TafsirResourceList.svelte';
	import TafsirEntry from './TafsirEntry.svelte';
	import PersonalTafsirEditor from './PersonalTafsirEditor.svelte';

	let selection = $derived(getSelection());
	let courseId = $derived(getActiveCourseId());
	let isVerseLevel = $derived(isVerseLevelSelection());

	let resources = $state<TafsirResourceRow[]>([]);
	let entries = $state<TafsirEntryWithResource[]>([]);
	let userTafsir = $state<UserTafsirRow | null>(null);

	$effect(() => {
		loadResources();
	});

	$effect(() => {
		if (isVerseLevel && selection.verseNumber && courseId) {
			loadEntries(selection.surahNumber, selection.verseNumber, courseId);
		} else {
			entries = [];
			userTafsir = null;
		}
	});

	async function loadResources() {
		try {
			resources = await getAllTafsirResources();
		} catch {
			resources = [];
		}
	}

	async function loadEntries(surahNumber: number, verseNumber: number, cid: number) {
		try {
			const [e, ut] = await Promise.all([
				getTafsirEntriesForVerse(surahNumber, verseNumber),
				getUserTafsir(cid, surahNumber, verseNumber)
			]);
			entries = e;
			userTafsir = ut;
		} catch {
			entries = [];
			userTafsir = null;
		}
	}

	async function handleSavePersonal(data: { personalTafsir?: string; note?: string }) {
		if (!courseId || !selection.verseNumber) return;
		try {
			await upsertUserTafsir(courseId, selection.surahNumber, selection.verseNumber, data);
			userTafsir = await getUserTafsir(
				courseId,
				selection.surahNumber,
				selection.verseNumber
			);
		} catch (err) {
			console.error('Failed to save personal tafsir:', err);
		}
	}
</script>

{#if !isVerseLevel}
	<p class="text-sm text-muted-foreground text-center py-8">
		{t('analysis.select_verse')}
	</p>
{:else}
	<div class="space-y-4">
		<TafsirResourceList {resources} />

		{#if entries.length > 0}
			<div class="space-y-2">
				{#each entries as entry (entry.id)}
					<TafsirEntry {entry} />
				{/each}
			</div>
		{/if}

		<PersonalTafsirEditor {userTafsir} onsave={handleSavePersonal} />
	</div>
{/if}
