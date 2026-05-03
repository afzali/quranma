<script lang="ts">
	import { t } from '$lib/i18n';
	import { getSelection, isVerseLevelSelection } from '$lib/state/selection-context.svelte';
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import {
		getVerseWords,
		type WordWithTranslation
	} from '$lib/data/repositories/quran-repository';
	import {
		getUserWordData,
		upsertUserWordData,
		type UserWordDataRow
	} from '$lib/data/repositories/word-data-repository';
	import WordCard from './WordCard.svelte';

	let selection = $derived(getSelection());
	let courseId = $derived(getActiveCourseId());
	let isVerseLevel = $derived(isVerseLevelSelection());

	let words = $state<WordWithTranslation[]>([]);
	let userWordData = $state<UserWordDataRow[]>([]);

	$effect(() => {
		if (isVerseLevel && selection.verseNumber && courseId) {
			loadWords(selection.surahNumber, selection.verseNumber, courseId);
		} else {
			words = [];
			userWordData = [];
		}
	});

	async function loadWords(surahNumber: number, verseNumber: number, cid: number) {
		try {
			const [w, uwd] = await Promise.all([
				getVerseWords(surahNumber, verseNumber),
				getUserWordData(cid, surahNumber, verseNumber)
			]);
			words = w;
			userWordData = uwd;
		} catch (err) {
			console.error('Failed to load word data:', err);
			words = [];
			userWordData = [];
		}
	}

	function getUserDataForWord(position: number): UserWordDataRow | null {
		return userWordData.find((d) => d.word_position === position) ?? null;
	}

	async function handleWordUpdate(
		wordPosition: number,
		data: { personalMeaning?: string; selectedMeaning?: string; note?: string }
	) {
		if (!courseId || !selection.verseNumber) return;
		try {
			await upsertUserWordData(
				courseId,
				selection.surahNumber,
				selection.verseNumber,
				wordPosition,
				data
			);
			// Reload user data to reflect changes
			userWordData = await getUserWordData(
				courseId,
				selection.surahNumber,
				selection.verseNumber
			);
		} catch (err) {
			console.error('Failed to save word data:', err);
		}
	}
</script>

{#if !isVerseLevel}
	<p class="text-sm text-muted-foreground text-center py-8">
		{t('analysis.select_verse')}
	</p>
{:else if words.length === 0}
	<p class="text-sm text-muted-foreground text-center py-8">
		{t('common.loading')}
	</p>
{:else}
	<div class="space-y-2">
		{#each words as word (word.id)}
			<WordCard
				{word}
				userData={getUserDataForWord(word.position)}
				onupdate={handleWordUpdate}
			/>
		{/each}
	</div>
{/if}
