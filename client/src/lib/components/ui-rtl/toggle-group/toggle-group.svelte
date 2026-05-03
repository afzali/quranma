<script module>
	// Re-export from base component
	export { setToggleGroupCtx, getToggleGroupCtx } from '$lib/components/ui/toggle-group/toggle-group.svelte';
</script>

<script>
	import BaseToggleGroup from '$lib/components/ui/toggle-group/toggle-group.svelte';
	
	let props = $props();
</script>

<BaseToggleGroup {...props} />
