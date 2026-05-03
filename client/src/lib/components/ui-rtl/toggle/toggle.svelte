<script module>
	// Re-export from base component
	export { toggleVariants } from '$lib/components/ui/toggle/toggle.svelte';
</script>

<script>
	import BaseToggle from '$lib/components/ui/toggle/toggle.svelte';
	
	let props = $props();
</script>

<BaseToggle {...props} />
