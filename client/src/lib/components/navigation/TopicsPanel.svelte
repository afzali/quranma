<script lang="ts">
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import {
		getTopicsWithVerses,
		insertTopic,
		type TopicWithVerses
	} from '$lib/data/repositories/topic-repository';
	import { selectVerse } from '$lib/state/selection-context.svelte';
	import { t } from '$lib/i18n';
	import TopicItem from './TopicItem.svelte';

	let courseId = $derived(getActiveCourseId());
	let topics = $state<TopicWithVerses[]>([]);
	let loading = $state(true);
	let showCreateInput = $state(false);
	let createValue = $state('');

	$effect(() => {
		const cid = courseId;
		if (cid) {
			loadTopics(cid);
		} else {
			topics = [];
			loading = false;
		}
	});

	async function loadTopics(cid: number) {
		loading = true;
		try {
			topics = await getTopicsWithVerses(cid);
		} catch (e) {
			console.error('Failed to load topics:', e);
			topics = [];
		} finally {
			loading = false;
		}
	}

	async function handleCreate() {
		const name = createValue.trim();
		if (!name) return;
		const cid = courseId;
		if (!cid) return;

		await insertTopic(cid, name);
		createValue = '';
		showCreateInput = false;
		await loadTopics(cid);
	}

	function handleVerseClick(surahNumber: number, verseNumber: number) {
		selectVerse(surahNumber, verseNumber);
	}

	async function handleTopicChange() {
		const cid = courseId;
		if (cid) {
			await loadTopics(cid);
		}
	}
</script>

<div class="flex flex-col h-full">
	{#if loading}
		<div class="flex items-center justify-center flex-1 text-muted-foreground text-sm">
			{t('app.loading')}
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto p-1">
			{#each topics as topic (topic.id)}
				<TopicItem
					{topic}
					onverseclick={handleVerseClick}
					onchange={handleTopicChange}
				/>
			{/each}

			{#if topics.length === 0 && !showCreateInput}
				<div class="flex items-center justify-center py-8 text-muted-foreground text-sm">
					{t('topic.empty')}
				</div>
			{/if}
		</div>

		<!-- Create new topic -->
		<div class="border-t border-border p-2">
			{#if showCreateInput}
				<div class="flex items-center gap-1">
					<input
						type="text"
						bind:value={createValue}
						placeholder={t('topic.create')}
						class="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1 text-sm"
						onkeydown={(e) => {
							if (e.key === 'Enter') handleCreate();
							if (e.key === 'Escape') (showCreateInput = false);
						}}
					/>
					<button
						type="button"
						class="text-sm text-primary hover:underline px-1"
						onclick={handleCreate}
					>
						{t('topic.create')}
					</button>
				</div>
			{:else}
				<button
					type="button"
					class="w-full text-start rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
					onclick={() => (showCreateInput = true)}
				>
					+ {t('topic.create')}
				</button>
			{/if}
		</div>
	{/if}
</div>
