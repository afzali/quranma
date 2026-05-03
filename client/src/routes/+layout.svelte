<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import RtlProvider from '$lib/components/ui-rtl/rtl-provider.svelte';
	import { getDirection, getLocale } from '$lib/state/i18n-context.svelte';
	import { initDatabase } from '$lib/data/database';
	import { initCourseContext } from '$lib/state/course-context.svelte';
	import { restoreSelection } from '$lib/state/selection-context.svelte';

	let { children } = $props();

	let direction = $derived(getDirection());
	let locale = $derived(getLocale());
	let isRtl = $derived(direction === 'rtl');
	let ready = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			await initDatabase();
			await initCourseContext();
			await restoreSelection();
			ready = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to initialize database';
			console.error('Database initialization failed:', e);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if error}
	<div class="flex h-full w-full items-center justify-center">
		<p class="text-destructive">Database error: {error}</p>
	</div>
{:else if ready}
	<RtlProvider rtl={isRtl} lang={locale} class="h-full w-full">
		{@render children()}
	</RtlProvider>
{:else}
	<div class="flex h-full w-full items-center justify-center">
		<p class="text-muted-foreground">Loading...</p>
	</div>
{/if}
