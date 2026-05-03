<script lang="ts">
	import type { TopicWithVerses } from '$lib/data/repositories/topic-repository';
	import {
		updateTopicName,
		deleteTopic,
		removeVerseFromTopic
	} from '$lib/data/repositories/topic-repository';
	import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui-rtl/collapsible';
	import { t } from '$lib/i18n';
	import TopicVerseItem from './TopicVerseItem.svelte';

	let {
		topic,
		onverseclick,
		onchange
	}: {
		topic: TopicWithVerses;
		onverseclick?: (surahNumber: number, verseNumber: number) => void;
		onchange?: () => void;
	} = $props();

	let open = $state(false);
	let renaming = $state(false);
	let renameValue = $state('');

	function startRename() {
		renaming = true;
		renameValue = topic.name;
	}

	async function handleRename() {
		const name = renameValue.trim();
		if (name && name !== topic.name) {
			await updateTopicName(topic.id, name);
			onchange?.();
		}
		renaming = false;
	}

	async function handleDelete() {
		await deleteTopic(topic.id);
		onchange?.();
	}

	async function handleRemoveVerse(surahNumber: number, verseNumber: number) {
		await removeVerseFromTopic(topic.id, surahNumber, verseNumber);
		onchange?.();
	}
</script>

<Collapsible {open} onOpenChange={(v) => (open = v)} class="mb-1">
	<div class="flex items-center gap-1">
		<CollapsibleTrigger
			class="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md"
		>
			<svg
				class="w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 {open
					? 'rotate-90'
					: ''}"
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

			{#if renaming}
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="text"
					bind:value={renameValue}
					class="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-sm"
					onkeydown={(e) => {
						if (e.key === 'Enter') handleRename();
						if (e.key === 'Escape') (renaming = false);
					}}
					onblur={handleRename}
					onclick={(e) => e.stopPropagation()}
					autofocus
				/>
			{:else}
				<span class="truncate">{topic.name}</span>
				<span class="text-xs text-muted-foreground flex-shrink-0">({topic.verses.length})</span>
			{/if}
		</CollapsibleTrigger>

		{#if !renaming}
			<button
				type="button"
				class="flex-shrink-0 p-0.5 text-muted-foreground hover:text-foreground"
				onclick={startRename}
				aria-label={t('topic.rename')}
				title={t('topic.rename')}
			>
				<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
				</svg>
			</button>
			<button
				type="button"
				class="flex-shrink-0 p-0.5 text-muted-foreground hover:text-destructive"
				onclick={handleDelete}
				aria-label={t('topic.delete')}
				title={t('topic.delete')}
			>
				<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
				</svg>
			</button>
		{/if}
	</div>

	<CollapsibleContent>
		<div class="ps-6">
			{#if topic.description}
				<p class="text-xs text-muted-foreground px-2 py-1">{topic.description}</p>
			{/if}
			{#each topic.verses as verse (verse.surahNumber + '-' + verse.verseNumber)}
				<TopicVerseItem
					{verse}
					onclick={onverseclick}
					onremove={(sn, vn) => handleRemoveVerse(sn, vn)}
				/>
			{/each}
			{#if topic.verses.length === 0}
				<p class="text-xs text-muted-foreground px-2 py-1">{t('topic.empty')}</p>
			{/if}
		</div>
	</CollapsibleContent>
</Collapsible>
