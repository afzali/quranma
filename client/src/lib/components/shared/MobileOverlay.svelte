<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		getNavBarVisible,
		getAnalysisPanelVisible,
		toggleNavBar,
		toggleAnalysisPanel
	} from '$lib/state/ui-context.svelte';

	let {
		navigationContent,
		analysisContent
	}: {
		navigationContent?: Snippet;
		analysisContent?: Snippet;
	} = $props();

	let navVisible = $derived(getNavBarVisible());
	let analysisVisible = $derived(getAnalysisPanelVisible());
</script>

<!-- Mobile overlay panels, only visible on small screens (<768px) -->
<div class="md:hidden">
	<!-- Navigation overlay -->
	{#if navVisible}
		<div class="fixed inset-0 z-40">
			<!-- Backdrop -->
			<button
				class="absolute inset-0 bg-black/50"
				onclick={toggleNavBar}
				aria-label="Close navigation"
			></button>
			<!-- Panel slides in from the right (in both LTR and RTL, navigation is on the right) -->
			<div class="absolute top-0 end-0 bottom-0 w-72 bg-background shadow-lg overflow-y-auto">
				{#if navigationContent}
					{@render navigationContent()}
				{:else}
					<!-- TODO: NavigationBar will go here in Task 6 -->
					<div class="flex items-center justify-center h-full text-muted-foreground">
						Navigation
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Analysis overlay -->
	{#if analysisVisible}
		<div class="fixed inset-0 z-40">
			<!-- Backdrop -->
			<button
				class="absolute inset-0 bg-black/50"
				onclick={toggleAnalysisPanel}
				aria-label="Close analysis panel"
			></button>
			<!-- Panel slides in from the left (in both LTR and RTL, analysis is on the left) -->
			<div class="absolute top-0 start-0 bottom-0 w-72 bg-background shadow-lg overflow-y-auto">
				{#if analysisContent}
					{@render analysisContent()}
				{:else}
					<!-- TODO: AnalysisPlaceholder content -->
					<div class="flex items-center justify-center h-full text-muted-foreground">
						Analysis
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
