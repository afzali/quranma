<script lang="ts">
	import CourseSwitcher from './CourseSwitcher.svelte';
	import NavigationTabs from './NavigationTabs.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
</script>

<div class="flex flex-col h-full">
	<!-- Course switcher at the top -->
	<CourseSwitcher />

	<!-- Tabbed navigation panels -->
	<div class="flex-1 overflow-hidden">
		<NavigationTabs />
	</div>

	<!-- Language switcher at the bottom -->
	<div class="flex items-center justify-center border-t border-border p-3">
		<LanguageSwitcher />
	</div>
</div>
