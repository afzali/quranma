<script lang="ts">
	import { t } from '$lib/i18n';
	import { getSelection, isVerseLevelSelection } from '$lib/state/selection-context.svelte';
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import {
		getAllTranslationResources,
		getTranslationEntriesForVerse,
		type TranslationResourceRow,
		type TranslationEntryWithResource
	} from '$lib/data/repositories/resource-repository';
	import {
		getUserTranslation,
		upsertUserTranslation,
		type UserTranslationRow
	} from '$lib/data/repositories/translation-repository';
	import TranslationResourceList from './TranslationResourceList.svelte';
	import TranslationEntry from './TranslationEntry.svelte';
	import PersonalTranslationEditor from './PersonalTranslationEditor.svelte';

	let selection = $derived(getSelection());
	let courseId = $derived(getActiveCourseId());
	let isVerseLevel = $derived(isVerseLevelSelection());

	let resources = $state<TranslationResourceRow[]>([]);
	let entries = $state<TranslationEntryWithResource[]>([]);
	let userTranslation = $state<UserTranslationRow | null>(null);

	$effect(() => {
		loadResources();
	});

	$effect(() => {
		if (isVerseLevel && selection.verseNumber && courseId) {
			loadEntries(selection.surahNumber, selection.verseNumber, courseId);
		} else {
			entries = [];
			userTranslation = null;
		}
	});

	async function loadResources() {
		try {
			resources = await getAllTranslationResources();
		} catch {
			resources = [];
		}
	}

	async function loadEntries(surahNumber: number, verseNumber: number, cid: number) {
		try {
			const [e, ut] = await Promise.all([
				getTranslationEntriesForVerse(surahNumber, verseNumber),
				getUserTranslation(cid, surahNumber, verseNumber)
			]);
			entries = e;
			userTranslation = ut;
		} catch {
			entries = [];
			userTranslation = null;
		}
	}

	async function handleSavePersonal(data: { personalTranslation?: string; note?: string }) {
		if (!courseId || !selection.verseNumber) return;
		try {
			await upsertUserTranslation(courseId, selection.surahNumber, selection.verseNumber, data);
			userTranslation = await getUserTranslation(
				courseId,
				selection.surahNumber,
				selection.verseNumber
			);
		} catch (err) {
			console.error('Failed to save personal translation:', err);
		}
	}
</script>

{#if !isVerseLevel}
	<p class="text-sm text-muted-foreground text-center py-8">
		{t('analysis.select_verse')}
	</p>
{:else}
	<div class="space-y-4">
		<!-- Translation resources list -->
		<TranslationResourceList {resources} />

		<!-- Translation entries for selected verse -->
		{#if entries.length > 0}
			<div class="space-y-2">
				{#each entries as entry (entry.id)}
					<TranslationEntry {entry} />
				{/each}
			</div>
		{/if}

		<!-- Personal translation editor -->
		<PersonalTranslationEditor {userTranslation} onsave={handleSavePersonal} />
	</div>
{/if}
