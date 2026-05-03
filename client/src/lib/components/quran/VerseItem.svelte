<script lang="ts">
	import type { Verse } from '$lib/data/repositories/quran-repository';
	import {
		isVerseBookmarked,
		insertBookmark,
		deleteBookmarkByVerse
	} from '$lib/data/repositories/bookmark-repository';
	import {
		getTopicsByCourse,
		addVerseToTopic,
		type TopicRow
	} from '$lib/data/repositories/topic-repository';
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import { toArabicIndic } from '$lib/utils/quran-utils';
	import { t } from '$lib/i18n';

	let {
		verse,
		isSelected = false,
		onclick
	}: {
		verse: Verse;
		isSelected?: boolean;
		onclick?: (verse: Verse) => void;
	} = $props();

	let bookmarked = $state(false);
	let courseId = $derived(getActiveCourseId());
	let showTopicMenu = $state(false);
	let topics = $state<TopicRow[]>([]);

	$effect(() => {
		const cid = courseId;
		const sn = verse.surahNumber;
		const vn = verse.verseNumber;
		if (cid) {
			checkBookmark(cid, sn, vn);
		}
	});

	async function checkBookmark(cid: number, surahNumber: number, verseNumber: number) {
		try {
			bookmarked = await isVerseBookmarked(cid, surahNumber, verseNumber);
		} catch {
			bookmarked = false;
		}
	}

	async function toggleBookmark(e: Event) {
		e.stopPropagation();
		const cid = courseId;
		if (!cid) return;

		try {
			if (bookmarked) {
				await deleteBookmarkByVerse(cid, verse.surahNumber, verse.verseNumber);
				bookmarked = false;
			} else {
				await insertBookmark(cid, verse.surahNumber, verse.verseNumber);
				bookmarked = true;
			}
		} catch (err) {
			console.error('Failed to toggle bookmark:', err);
		}
	}

	async function openTopicMenu(e: Event) {
		e.stopPropagation();
		const cid = courseId;
		if (!cid) return;

		try {
			topics = await getTopicsByCourse(cid);
			showTopicMenu = !showTopicMenu;
		} catch {
			topics = [];
		}
	}

	async function handleAddToTopic(topicId: number) {
		try {
			await addVerseToTopic(topicId, verse.surahNumber, verse.verseNumber);
		} catch (err) {
			// Likely a duplicate — ignore
			console.error('Failed to add verse to topic:', err);
		}
		showTopicMenu = false;
	}

	function handleClick() {
		onclick?.(verse);
	}
</script>

<div class="group relative">
	<button
		type="button"
		class="w-full text-start rounded-md px-3 py-2 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring {isSelected
			? 'bg-accent'
			: ''}"
		onclick={handleClick}
		aria-label="Verse {verse.verseNumber}"
		aria-pressed={isSelected}
	>
		<span lang="ar" dir="rtl" class="text-xl leading-loose inline">
			{verse.textOriginal}
		</span>
		<!-- Arabic-Indic verse number marker -->
		<span
			lang="ar"
			dir="rtl"
			class="inline-flex items-center justify-center mx-1 text-sm text-muted-foreground"
			aria-label="Verse number {verse.verseNumber}"
		>
			﴿{toArabicIndic(verse.verseNumber)}﴾
		</span>
	</button>

	<!-- Action buttons (bookmark + add to topic) -->
	<div class="absolute top-1 end-1 flex items-center gap-0.5">
		<!-- Add to Topic -->
		<button
			type="button"
			class="p-1 rounded-md transition-opacity opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
			onclick={openTopicMenu}
			aria-label={t('topic.add_verse')}
			title={t('topic.add_verse')}
		>
			<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
				<path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
			</svg>
		</button>

		<!-- Bookmark toggle -->
		<button
			type="button"
			class="p-1 rounded-md transition-opacity {bookmarked
				? 'opacity-100 text-primary'
				: 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'}"
			onclick={toggleBookmark}
			aria-label={bookmarked ? t('bookmark.remove') : t('bookmark.add')}
			title={bookmarked ? t('bookmark.remove') : t('bookmark.add')}
		>
			<svg
				class="w-4 h-4"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill={bookmarked ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
			</svg>
		</button>
	</div>

	<!-- Topic selection dropdown -->
	{#if showTopicMenu}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="fixed inset-0 z-40" onclick={() => (showTopicMenu = false)}></div>
		<div class="absolute end-1 top-8 z-50 min-w-40 rounded-md border border-border bg-popover shadow-md p-1">
			{#if topics.length === 0}
				<p class="text-xs text-muted-foreground px-2 py-1">{t('topic.empty')}</p>
			{:else}
				{#each topics as topic (topic.id)}
					<button
						type="button"
						class="w-full text-start rounded-sm px-2 py-1 text-sm hover:bg-accent/50"
						onclick={() => handleAddToTopic(topic.id)}
					>
						{topic.name}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
