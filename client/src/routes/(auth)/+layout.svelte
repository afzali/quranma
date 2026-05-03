<script lang="ts">
	let { children } = $props();
</script>

<!-- Minimal auth layout without the three-panel shell -->
<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="w-full max-w-md p-6">
		{@render children()}
	</div>
</div>
