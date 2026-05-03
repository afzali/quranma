<script lang="ts">
	import AppShell from '$lib/components/shared/AppShell.svelte';

	let { children } = $props();
</script>

<div class="h-screen w-screen overflow-hidden">
	<AppShell />
</div>

<!-- Route pages are headless (they set selection state from URL params).
     Render them so SvelteKit's routing lifecycle runs their $effect hooks. -->
<div class="hidden">
	{@render children()}
</div>
