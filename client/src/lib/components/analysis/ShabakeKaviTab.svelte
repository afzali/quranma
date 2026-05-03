<script lang="ts">
	import { t } from '$lib/i18n';
	import { getSelection, isVerseLevelSelection, selectVerse } from '$lib/state/selection-context.svelte';
	import { getActiveCourseId } from '$lib/state/course-context.svelte';
	import {
		getConnectionsForVerse,
		insertConnection,
		updateConnection,
		deleteConnection,
		type ShabakeKaviConnectionRow
	} from '$lib/data/repositories/shabake-kavi-repository';
	import ConnectionCard from './ConnectionCard.svelte';
	import ConnectionEditor from './ConnectionEditor.svelte';

	let selection = $derived(getSelection());
	let courseId = $derived(getActiveCourseId());
	let isVerseLevel = $derived(isVerseLevelSelection());

	let connections = $state<ShabakeKaviConnectionRow[]>([]);
	let showEditor = $state(false);
	let editingConnection = $state<ShabakeKaviConnectionRow | null>(null);

	// Group connections by target_type
	let grouped = $derived(() => {
		const map = new Map<string, ShabakeKaviConnectionRow[]>();
		for (const conn of connections) {
			const list = map.get(conn.target_type) ?? [];
			list.push(conn);
			map.set(conn.target_type, list);
		}
		return map;
	});

	$effect(() => {
		if (isVerseLevel && selection.verseNumber && courseId) {
			loadConnections(courseId, selection.surahNumber, selection.verseNumber);
		} else {
			connections = [];
		}
	});

	async function loadConnections(cid: number, surahNumber: number, verseNumber: number) {
		try {
			connections = await getConnectionsForVerse(cid, surahNumber, verseNumber);
		} catch {
			connections = [];
		}
	}

	async function handleSave(data: {
		id?: number;
		target_type: string;
		target_reference: string;
		title: string;
		description: string;
	}) {
		if (!courseId || !selection.verseNumber) return;
		try {
			if (data.id) {
				await updateConnection(data.id, {
					target_type: data.target_type,
					target_reference: data.target_reference,
					title: data.title,
					description: data.description || undefined
				});
			} else {
				await insertConnection(courseId, {
					source_surah: selection.surahNumber,
					source_verse: selection.verseNumber,
					target_type: data.target_type,
					target_reference: data.target_reference,
					title: data.title,
					description: data.description || undefined
				});
			}
			showEditor = false;
			editingConnection = null;
			await loadConnections(courseId, selection.surahNumber, selection.verseNumber);
		} catch (err) {
			console.error('Failed to save connection:', err);
		}
	}

	async function handleDelete(id: number) {
		if (!courseId || !selection.verseNumber) return;
		try {
			await deleteConnection(id);
			await loadConnections(courseId, selection.surahNumber, selection.verseNumber);
		} catch (err) {
			console.error('Failed to delete connection:', err);
		}
	}

	function handleNavigate(conn: ShabakeKaviConnectionRow) {
		if (conn.target_type !== 'verse') return;
		const parts = conn.target_reference.split(':');
		if (parts.length === 2) {
			const surah = parseInt(parts[0], 10);
			const verse = parseInt(parts[1], 10);
			if (!isNaN(surah) && !isNaN(verse)) {
				selectVerse(surah, verse);
			}
		}
	}

	function handleEdit(conn: ShabakeKaviConnectionRow) {
		editingConnection = conn;
		showEditor = true;
	}

	function handleCancel() {
		showEditor = false;
		editingConnection = null;
	}
</script>

{#if !isVerseLevel}
	<p class="text-sm text-muted-foreground text-center py-8">
		{t('analysis.select_verse')}
	</p>
{:else}
	<div class="space-y-3">
		<button
			type="button"
			class="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50"
			onclick={() => {
				editingConnection = null;
				showEditor = true;
			}}
		>
			+ {t('shabake_kavi.create')}
		</button>

		{#if showEditor}
			<ConnectionEditor {editingConnection} onsave={handleSave} oncancel={handleCancel} />
		{/if}

		{#each [...grouped().entries()] as [type, conns] (type)}
			<div class="space-y-1">
				<h3 class="text-xs font-medium text-muted-foreground uppercase">
					{t(`shabake_kavi.type.${type}`)}
				</h3>
				{#each conns as conn (conn.id)}
					<ConnectionCard
						connection={conn}
						onnavigate={handleNavigate}
						onedit={handleEdit}
						ondelete={handleDelete}
					/>
				{/each}
			</div>
		{/each}

		{#if connections.length === 0 && !showEditor}
			<p class="text-sm text-muted-foreground text-center py-4">
				{t('common.no_data')}
			</p>
		{/if}
	</div>
{/if}
