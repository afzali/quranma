<script module>
	// Re-export from base component
	export { buttonVariants } from '$lib/components/ui/button/button.svelte';
</script>

<script>
	import BaseButton from '$lib/components/ui/button/button.svelte';
	
	let props = $props();
</script>

<BaseButton {...props} />
