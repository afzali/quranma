<script lang="ts">
	import type { BookmarkGroup as BookmarkGroupType } from '$lib/data/repositories/bookmark-repository';
	import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui-rtl/collapsible';
	import BookmarkItem from './BookmarkItem.svelte';

	let {
		group,
		onbookmarkclick
	}: {
		group: BookmarkGroupType;
		onbookmarkclick?: (surahNumber: number, verseNumber: number) => void;
	} = $props();

	let open = $state(true);
</script>

<Collapsible {open} onOpenChange={(v) => (open = v)} class="mb-1">
	<CollapsibleTrigger
		class="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md"
	>
		<svg
			class="w-3.5 h-3.5 text-muted-foreground transition-transform {open ? 'rotate-90' : ''}"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m9 18 6-6-6-6" />
		</svg>
		<span lang="ar" dir="rtl">{group.surahNameArabic}</span>
		<span class="text-xs text-muted-foreground">({group.bookmarks.length})</span>
	</CollapsibleTrigger>

	<CollapsibleContent>
		<div class="ps-4">
			{#each group.bookmarks as bookmark (bookmark.id)}
				<BookmarkItem
					{bookmark}
					surahNameArabic={group.surahNameArabic}
					onclick={onbookmarkclick}
				/>
			{/each}
		</div>
	</CollapsibleContent>
</Collapsible>
