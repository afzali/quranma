<script lang="ts">
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import {
		getBookmarksGroupedBySurah,
		type BookmarkGroup as BookmarkGroupType
	} from '$lib/data/repositories/bookmark-repository';
	import { selectVerse } from '$lib/state/selection-context.svelte';
	import { t } from '$lib/i18n';
	import BookmarkGroup from './BookmarkGroup.svelte';

	let courseId = $derived(getActiveCourseId());
	let bookmarkGroups = $state<BookmarkGroupType[]>([]);
	let loading = $state(true);

	$effect(() => {
		const cid = courseId;
		if (cid) {
			loadBookmarks(cid);
		} else {
			bookmarkGroups = [];
			loading = false;
		}
	});

	async function loadBookmarks(cid: number) {
		loading = true;
		try {
			bookmarkGroups = await getBookmarksGroupedBySurah(cid);
		} catch (e) {
			console.error('Failed to load bookmarks:', e);
			bookmarkGroups = [];
		} finally {
			loading = false;
		}
	}

	function handleBookmarkClick(surahNumber: number, verseNumber: number) {
		selectVerse(surahNumber, verseNumber);
	}

	/**
	 * Refresh bookmarks — called externally when bookmarks change.
	 */
	export async function refresh() {
		const cid = courseId;
		if (cid) {
			await loadBookmarks(cid);
		}
	}
</script>

<div class="flex flex-col h-full">
	{#if loading}
		<div class="flex items-center justify-center flex-1 text-muted-foreground text-sm">
			{t('app.loading')}
		</div>
	{:else if bookmarkGroups.length === 0}
		<div class="flex items-center justify-center flex-1 text-muted-foreground text-sm">
			{t('bookmark.empty')}
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto p-1">
			{#each bookmarkGroups as group (group.surahNumber)}
				<BookmarkGroup {group} onbookmarkclick={handleBookmarkClick} />
			{/each}
		</div>
	{/if}
</div>
