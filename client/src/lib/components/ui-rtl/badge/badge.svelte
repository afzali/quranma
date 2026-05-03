<script module>
	// Re-export from base component
	export { badgeVariants } from '$lib/components/ui/badge/badge.svelte';
</script>

<script>
	import BaseBadge from '$lib/components/ui/badge/badge.svelte';
	
	let props = $props();
</script>

<BaseBadge {...props} />
