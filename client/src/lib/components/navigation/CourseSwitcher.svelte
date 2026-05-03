<script lang="ts">
	import { getActiveCourse } from '$lib/state/course-context.svelte';
	import { t } from '$lib/i18n';
	import CourseDropdown from './CourseDropdown.svelte';

	let activeCourse = $derived(getActiveCourse());
	let dropdownOpen = $state(false);

	function getInitials(name: string): string {
		return name.charAt(0).toUpperCase();
	}
</script>

<div class="flex items-center gap-2 px-3 py-2 border-b border-border">
	{#if activeCourse}
		<button
			type="button"
			class="flex items-center gap-2 flex-1 min-w-0 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50"
			onclick={() => (dropdownOpen = !dropdownOpen)}
			aria-expanded={dropdownOpen}
			aria-haspopup="true"
		>
			<!-- Avatar -->
			<span
				class="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-medium"
			>
				{getInitials(activeCourse.name)}
			</span>
			<!-- Course name -->
			<span class="truncate font-medium">{activeCourse.name}</span>
			<!-- Chevron -->
			<svg
				class="w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform {dropdownOpen
					? 'rotate-180'
					: ''}"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		</button>
	{/if}
</div>

{#if dropdownOpen}
	<CourseDropdown onclose={() => (dropdownOpen = false)} />
{/if}
