<script lang="ts">
	import { t } from '$lib/i18n';
	import { getSelection } from '$lib/state/selection-context.svelte';
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import {
		getEqamehEntriesForSurah,
		insertEqamehEntry,
		updateEqamehEntry,
		deleteEqamehEntry,
		type EqamehEntryRow
	} from '$lib/data/repositories/eqameh-repository';
	import EqamehEntryCard from './EqamehEntryCard.svelte';
	import EqamehEntryEditor from './EqamehEntryEditor.svelte';

	const TYPES = ['principle', 'duty', 'message', 'decision', 'action'] as const;

	let selection = $derived(getSelection());
	let courseId = $derived(getActiveCourseId());

	let entries = $state<EqamehEntryRow[]>([]);
	let showEditor = $state(false);
	let editingEntry = $state<EqamehEntryRow | null>(null);

	// Group entries by type
	let grouped = $derived(() => {
		const map = new Map<string, EqamehEntryRow[]>();
		for (const entry of entries) {
			const list = map.get(entry.type) ?? [];
			list.push(entry);
			map.set(entry.type, list);
		}
		return map;
	});

	$effect(() => {
		if (courseId) {
			loadEntries(courseId, selection.surahNumber);
		} else {
			entries = [];
		}
	});

	async function loadEntries(cid: number, surahNumber: number) {
		try {
			entries = await getEqamehEntriesForSurah(cid, surahNumber);
		} catch {
			entries = [];
		}
	}

	async function handleSave(data: {
		id?: number;
		type: string;
		textContent: string;
		verseNumber: number | null;
	}) {
		if (!courseId) return;
		try {
			if (data.id) {
				await updateEqamehEntry(data.id, {
					type: data.type,
					textContent: data.textContent,
					verseNumber: data.verseNumber
				});
			} else {
				await insertEqamehEntry(
					courseId,
					selection.surahNumber,
					data.verseNumber,
					data.type,
					data.textContent
				);
			}
			showEditor = false;
			editingEntry = null;
			await loadEntries(courseId, selection.surahNumber);
		} catch (err) {
			console.error('Failed to save eqameh entry:', err);
		}
	}

	async function handleDelete(id: number) {
		if (!courseId) return;
		try {
			await deleteEqamehEntry(id);
			await loadEntries(courseId, selection.surahNumber);
		} catch (err) {
			console.error('Failed to delete eqameh entry:', err);
		}
	}

	function handleEdit(entry: EqamehEntryRow) {
		editingEntry = entry;
		showEditor = true;
	}

	function handleCancel() {
		showEditor = false;
		editingEntry = null;
	}
</script>

<div class="space-y-3">
	<button
		type="button"
		class="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50"
		onclick={() => {
			editingEntry = null;
			showEditor = true;
		}}
	>
		+ {t('eqameh.create')}
	</button>

	{#if showEditor}
		<EqamehEntryEditor {editingEntry} onsave={handleSave} oncancel={handleCancel} />
	{/if}

	{#each TYPES as type}
		{@const typeEntries = grouped().get(type) ?? []}
		{#if typeEntries.length > 0}
			<div class="space-y-1">
				<h3 class="text-xs font-medium text-muted-foreground uppercase">
					{t(`eqameh.type.${type}`)}
				</h3>
				{#each typeEntries as entry (entry.id)}
					<EqamehEntryCard {entry} onedit={handleEdit} ondelete={handleDelete} />
				{/each}
			</div>
		{/if}
	{/each}

	{#if entries.length === 0 && !showEditor}
		<p class="text-sm text-muted-foreground text-center py-4">
			{t('common.no_data')}
		</p>
	{/if}
</div>
