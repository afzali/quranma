<script lang="ts">
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';
	import { isRtl } from '$lib/utils/rtl-context.svelte.js';
	import { getIsMobile, setIsMobile } from '$lib/state/ui-context.svelte';
	import AnalysisTabs from '$lib/components/analysis/AnalysisTabs.svelte';
	import MobileOverlay from './MobileOverlay.svelte';
	import QuranDisplay from '$lib/components/quran/QuranDisplay.svelte';
	import NavigationBar from '$lib/components/navigation/NavigationBar.svelte';

	const MOBILE_BREAKPOINT = 768;

	let mobile = $derived(getIsMobile());

	$effect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

		function handleChange(e: MediaQueryListEvent | MediaQueryList) {
			setIsMobile(e.matches);
		}

		// Set initial value
		handleChange(mql);

		mql.addEventListener('change', handleChange);
		return () => mql.removeEventListener('change', handleChange);
	});
</script>

<div class="h-full w-full" class:rtl-layout={isRtl()}>
	{#if mobile}
		<!-- Mobile: single center pane + overlay panels -->
		<div class="h-full">
			<QuranDisplay />
		</div>

		<MobileOverlay>
			{#snippet analysisContent()}
				<AnalysisTabs />
			{/snippet}
			{#snippet navigationContent()}
				<NavigationBar />
			{/snippet}
		</MobileOverlay>
	{:else}
		<!-- Desktop: three-panel resizable layout -->
		<PaneGroup direction="horizontal" autoSaveId="quran-ma-layout">
			<!-- Analysis Panel (Left in DOM, visually left in LTR / right in RTL) -->
			<Pane defaultSize={25} minSize={15} collapsible collapsedSize={0}>
				<AnalysisTabs />
			</Pane>
			<PaneResizer class="w-1.5 bg-border hover:bg-primary/20 transition-colors" />

			<!-- Quran Display (Center) -->
			<Pane defaultSize={50} minSize={30}>
				<QuranDisplay />
			</Pane>
			<PaneResizer class="w-1.5 bg-border hover:bg-primary/20 transition-colors" />

			<!-- Navigation Bar (Right in DOM, visually right in LTR / left in RTL) -->
			<Pane defaultSize={25} minSize={15} collapsible collapsedSize={0}>
				<NavigationBar />
			</Pane>
		</PaneGroup>
	{/if}
</div>

<style>
	/*
	 * RTL-aware panel ordering:
	 * In RTL mode, CSS direction: rtl on the PaneGroup container visually reverses
	 * the flex order so Navigation appears on the right and Analysis on the left.
	 * The DOM order stays the same (Analysis → Quran → Navigation).
	 */
	.rtl-layout :global([data-pane-group]) {
		direction: rtl;
	}

	/* Ensure content inside panes remains correctly directed */
	.rtl-layout :global([data-pane]) {
		direction: rtl;
	}

	/* In LTR mode, ensure normal direction */
	:not(.rtl-layout) :global([data-pane-group]) {
		direction: ltr;
	}

	:not(.rtl-layout) :global([data-pane]) {
		direction: ltr;
	}
</style>
