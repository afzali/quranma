<script lang="ts">
	import { t } from '$lib/i18n';
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import { setActiveNazmKaviId, getActiveNazmKaviId } from '$lib/state/highlight-context.svelte';
	import {
		getNazmKaviItemsByCourse,
		getNazmKaviItemWithVerses,
		insertNazmKaviItem,
		updateNazmKaviItem,
		deleteNazmKaviItem,
		setNazmKaviVerses,
		type NazmKaviItemRow,
		type NazmKaviVerseRow
	} from '$lib/data/repositories/nazm-kavi-repository';
	import { loadNazmKaviHighlights } from '$lib/services/highlight-service';
	import NazmKaviItemCard from './NazmKaviItemCard.svelte';
	import NazmKaviItemEditor from './NazmKaviItemEditor.svelte';
	import NazmKaviTypeFilter from './NazmKaviTypeFilter.svelte';

	let courseId = $derived(getActiveCourseId());

	let items = $state<NazmKaviItemRow[]>([]);
	let itemVerses = $state<Map<number, NazmKaviVerseRow[]>>(new Map());
	let activeFilter = $state('all');
	let showEditor = $state(false);
	let editingItem = $state<NazmKaviItemRow | null>(null);

	let filteredItems = $derived(
		activeFilter === 'all' ? items : items.filter((i) => i.type === activeFilter)
	);

	$effect(() => {
		if (courseId) {
			loadItems(courseId);
		} else {
			items = [];
			itemVerses = new Map();
		}
	});

	async function loadItems(cid: number) {
		try {
			items = await getNazmKaviItemsByCourse(cid);
			const versesMap = new Map<number, NazmKaviVerseRow[]>();
			for (const item of items) {
				const full = await getNazmKaviItemWithVerses(item.id);
				if (full) {
					versesMap.set(item.id, full.verses);
				}
			}
			itemVerses = versesMap;
		} catch {
			items = [];
			itemVerses = new Map();
		}
	}

	function parseVerses(input: string): { surahNumber: number; verseNumber: number }[] {
		if (!input) return [];
		return input
			.split(',')
			.map((s) => s.trim().split(':'))
			.filter((parts) => parts.length === 2)
			.map(([s, v]) => ({ surahNumber: parseInt(s, 10), verseNumber: parseInt(v, 10) }))
			.filter((v) => !isNaN(v.surahNumber) && !isNaN(v.verseNumber));
	}

	async function handleSave(data: {
		id?: number;
		type: string;
		title: string;
		description: string;
		verses: string;
	}) {
		if (!courseId) return;
		const verses = parseVerses(data.verses);
		try {
			if (data.id) {
				await updateNazmKaviItem(data.id, {
					type: data.type,
					title: data.title,
					description: data.description || undefined
				});
				if (verses.length > 0) {
					await setNazmKaviVerses(data.id, verses);
				}
			} else {
				const id = await insertNazmKaviItem(
					courseId,
					data.type,
					data.title,
					data.description || undefined
				);
				if (verses.length > 0) {
					await setNazmKaviVerses(id, verses);
				}
			}
			showEditor = false;
			editingItem = null;
			await loadItems(courseId);
		} catch (err) {
			console.error('Failed to save nazm-kavi item:', err);
		}
	}

	async function handleDelete(id: number) {
		if (!courseId) return;
		try {
			const activeId = getActiveNazmKaviId();
			if (activeId === id) {
				setActiveNazmKaviId(null);
			}
			await deleteNazmKaviItem(id);
			await loadItems(courseId);
		} catch (err) {
			console.error('Failed to delete nazm-kavi item:', err);
		}
	}

	async function handleActivate(id: number) {
		const activeId = getActiveNazmKaviId();
		if (activeId === id) {
			setActiveNazmKaviId(null);
		} else {
			setActiveNazmKaviId(id);
			await loadNazmKaviHighlights(id);
		}
	}

	function handleEdit(item: NazmKaviItemRow) {
		editingItem = item;
		showEditor = true;
	}

	function handleCancel() {
		showEditor = false;
		editingItem = null;
	}
</script>

<div class="space-y-3">
	<NazmKaviTypeFilter {activeFilter} onfilter={(type) => (activeFilter = type)} />

	<button
		type="button"
		class="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50"
		onclick={() => {
			editingItem = null;
			showEditor = true;
		}}
	>
		+ {t('nazm_kavi.create')}
	</button>

	{#if showEditor}
		<NazmKaviItemEditor {editingItem} onsave={handleSave} oncancel={handleCancel} />
	{/if}

	{#each filteredItems as item (item.id)}
		<NazmKaviItemCard
			{item}
			verses={itemVerses.get(item.id) ?? []}
			onactivate={handleActivate}
			onedit={handleEdit}
			ondelete={handleDelete}
		/>
	{/each}

	{#if filteredItems.length === 0 && !showEditor}
		<p class="text-sm text-muted-foreground text-center py-4">
			{t('common.no_data')}
		</p>
	{/if}
</div>
