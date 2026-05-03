<script lang="ts">
	import { t } from '$lib/i18n';
	import { getSelection } from '$lib/state/selection-context.svelte';
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import {
		getSiyaqGroupsForSurah,
		insertSiyaqGroup,
		updateSiyaqGroup,
		deleteSiyaqGroup,
		setSiyaqVerses,
		type SiyaqGroupWithVerses
	} from '$lib/data/repositories/siyaq-repository';
	import { loadSiyaqHighlights } from '$lib/services/highlight-service';
	import SiyaqGroupCard from './SiyaqGroupCard.svelte';
	import SiyaqGroupEditor from './SiyaqGroupEditor.svelte';
	import SiyaqToggle from './SiyaqToggle.svelte';

	let selection = $derived(getSelection());
	let courseId = $derived(getActiveCourseId());

	let groups = $state<SiyaqGroupWithVerses[]>([]);
	let showEditor = $state(false);
	let editingGroup = $state<SiyaqGroupWithVerses | null>(null);

	$effect(() => {
		if (courseId) {
			loadGroups(courseId, selection.surahNumber);
		} else {
			groups = [];
		}
	});

	async function loadGroups(cid: number, surahNumber: number) {
		try {
			groups = await getSiyaqGroupsForSurah(cid, surahNumber);
		} catch {
			groups = [];
		}
	}

	function parseVerses(input: string, surahNumber: number) {
		return input
			.split(',')
			.map((s) => parseInt(s.trim(), 10))
			.filter((n) => !isNaN(n) && n > 0)
			.map((n) => ({ surahNumber, verseNumber: n }));
	}

	async function handleSave(data: {
		id?: number;
		title: string;
		color: string;
		description: string;
		verses: string;
	}) {
		if (!courseId) return;
		const verses = parseVerses(data.verses, selection.surahNumber);
		try {
			if (data.id) {
				await updateSiyaqGroup(data.id, {
					title: data.title,
					color: data.color,
					description: data.description
				});
				await setSiyaqVerses(data.id, verses);
			} else {
				const id = await insertSiyaqGroup(
					courseId,
					selection.surahNumber,
					data.title,
					data.color,
					data.description || undefined
				);
				await setSiyaqVerses(id, verses);
			}
			showEditor = false;
			editingGroup = null;
			await loadGroups(courseId, selection.surahNumber);
			await loadSiyaqHighlights(courseId, selection.surahNumber);
		} catch (err) {
			console.error('Failed to save siyaq group:', err);
		}
	}

	async function handleDelete(id: number) {
		if (!courseId) return;
		try {
			await deleteSiyaqGroup(id);
			await loadGroups(courseId, selection.surahNumber);
			await loadSiyaqHighlights(courseId, selection.surahNumber);
		} catch (err) {
			console.error('Failed to delete siyaq group:', err);
		}
	}

	function handleEdit(group: SiyaqGroupWithVerses) {
		editingGroup = group;
		showEditor = true;
	}

	function handleCancel() {
		showEditor = false;
		editingGroup = null;
	}
</script>

<div class="space-y-3">
	<SiyaqToggle />

	<button
		type="button"
		class="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50"
		onclick={() => {
			editingGroup = null;
			showEditor = true;
		}}
	>
		+ {t('siyaq.create')}
	</button>

	{#if showEditor}
		<SiyaqGroupEditor {editingGroup} onsave={handleSave} oncancel={handleCancel} />
	{/if}

	{#each groups as group (group.id)}
		<SiyaqGroupCard {group} onedit={handleEdit} ondelete={handleDelete} />
	{/each}

	{#if groups.length === 0 && !showEditor}
		<p class="text-sm text-muted-foreground text-center py-4">
			{t('common.no_data')}
		</p>
	{/if}
</div>
