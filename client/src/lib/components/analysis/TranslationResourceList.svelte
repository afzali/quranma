<script lang="ts">
	import type { TranslationResourceRow } from '$lib/data/repositories/resource-repository';

	let {
		resources
	}: {
		resources: TranslationResourceRow[];
	} = $props();
</script>

{#if resources.length > 0}
	<div class="space-y-1">
		{#each resources as resource (resource.id)}
			<div class="flex items-center justify-between rounded-md border border-border px-2 py-1 text-xs">
				<span>{resource.name}</span>
				<span class="text-muted-foreground">{resource.language}</span>
			</div>
		{/each}
	</div>
{/if}
