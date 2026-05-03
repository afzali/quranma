<script module>
	// Re-export from base component
	export { emptyMediaVariants } from '$lib/components/ui/empty/empty-media.svelte';
</script>

<script>
	import BaseEmptyMedia from '$lib/components/ui/empty/empty-media.svelte';
	
	let props = $props();
</script>

<BaseEmptyMedia {...props} />
