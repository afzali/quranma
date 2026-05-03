<script lang="ts">
	import {
		getAllCourses,
		getActiveCourseId,
		switchCourse,
		createCourse,
		renameCourse,
		deleteCourse,
		duplicateCourse
	} from '$lib/state/course-context.svelte';
	import { restoreSelection } from '$lib/state/selection-context.svelte';
	import { t } from '$lib/i18n';

	let { onclose }: { onclose: () => void } = $props();

	let courses = $derived(getAllCourses());
	let activeCourseId = $derived(getActiveCourseId());

	let renamingId = $state<number | null>(null);
	let renameValue = $state('');
	let showCreateInput = $state(false);
	let createValue = $state('');

	async function handleSwitch(courseId: number) {
		if (courseId === activeCourseId) {
			onclose();
			return;
		}
		await switchCourse(courseId);
		await restoreSelection();
		onclose();
	}

	async function handleCreate() {
		const name = createValue.trim();
		if (!name) return;
		await createCourse(name);
		await restoreSelection();
		createValue = '';
		showCreateInput = false;
		onclose();
	}

	function startRename(courseId: number, currentName: string) {
		renamingId = courseId;
		renameValue = currentName;
	}

	async function handleRename() {
		if (renamingId == null) return;
		const name = renameValue.trim();
		if (!name) {
			renamingId = null;
			return;
		}
		await renameCourse(renamingId, name);
		renamingId = null;
	}

	async function handleDelete(courseId: number) {
		const success = await deleteCourse(courseId);
		if (!success) {
			// Last course — can't delete
			return;
		}
		await restoreSelection();
	}

	async function handleDuplicate(courseId: number) {
		await duplicateCourse(courseId);
		await restoreSelection();
		onclose();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="fixed inset-0 z-40" onclick={onclose}></div>

<div
	class="relative z-50 mx-2 rounded-md border border-border bg-popover shadow-md"
	role="menu"
>
	<div class="max-h-60 overflow-y-auto p-1">
		{#each courses as course (course.id)}
			<div
				class="flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm {course.id === activeCourseId
					? 'bg-accent'
					: 'hover:bg-accent/50'}"
				role="menuitem"
			>
				{#if renamingId === course.id}
					<input
						type="text"
						bind:value={renameValue}
						class="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-sm"
						onkeydown={(e) => {
							if (e.key === 'Enter') handleRename();
							if (e.key === 'Escape') (renamingId = null);
						}}
						onblur={handleRename}
					/>
				{:else}
					<button
						type="button"
						class="flex-1 min-w-0 text-start truncate"
						onclick={() => handleSwitch(course.id)}
					>
						{course.name}
					</button>

					<!-- Actions -->
					<button
						type="button"
						class="flex-shrink-0 p-0.5 text-muted-foreground hover:text-foreground"
						onclick={() => startRename(course.id, course.name)}
						aria-label={t('course.rename')}
						title={t('course.rename')}
					>
						<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
						</svg>
					</button>
					<button
						type="button"
						class="flex-shrink-0 p-0.5 text-muted-foreground hover:text-foreground"
						onclick={() => handleDuplicate(course.id)}
						aria-label={t('course.duplicate')}
						title={t('course.duplicate')}
					>
						<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
							<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
						</svg>
					</button>
					<button
						type="button"
						class="flex-shrink-0 p-0.5 text-muted-foreground hover:text-destructive"
						onclick={() => handleDelete(course.id)}
						aria-label={t('course.delete')}
						title={t('course.delete')}
					>
						<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
						</svg>
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Create new course -->
	<div class="border-t border-border p-1">
		{#if showCreateInput}
			<div class="flex items-center gap-1 px-2 py-1">
				<input
					type="text"
					bind:value={createValue}
					placeholder={t('course.create')}
					class="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-sm"
					onkeydown={(e) => {
						if (e.key === 'Enter') handleCreate();
						if (e.key === 'Escape') (showCreateInput = false);
					}}
				/>
				<button
					type="button"
					class="text-sm text-primary hover:underline"
					onclick={handleCreate}
				>
					{t('course.create')}
				</button>
			</div>
		{:else}
			<button
				type="button"
				class="w-full text-start rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
				onclick={() => (showCreateInput = true)}
			>
				+ {t('course.create')}
			</button>
		{/if}
	</div>
</div>
