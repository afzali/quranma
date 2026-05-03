<script lang="ts">
	import TableOfContents from './TableOfContents.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
</script>

<div class="flex flex-col h-full">
	<!-- Table of Contents takes up most of the space -->
	<div class="flex-1 overflow-hidden">
		<TableOfContents />
	</div>

	<!-- Language switcher at the bottom -->
	<div class="flex items-center justify-center border-t border-border p-3">
		<LanguageSwitcher />
	</div>
</div>
