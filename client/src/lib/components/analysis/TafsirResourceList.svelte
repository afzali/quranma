<script lang="ts">
	import type { TafsirResourceRow } from '$lib/data/repositories/resource-repository';

	let {
		resources
	}: {
		resources: TafsirResourceRow[];
	} = $props();
</script>

{#if resources.length > 0}
	<div class="space-y-1">
		{#each resources as resource (resource.id)}
			<div class="flex items-center justify-between rounded-md border border-border px-2 py-1 text-xs">
				<span>{resource.name_fa}</span>
				<span class="text-muted-foreground">{resource.author}</span>
			</div>
		{/each}
	</div>
{/if}
