<script lang="ts">
	import type { TafsirEntryWithResource } from '$lib/data/repositories/resource-repository';

	let {
		entry
	}: {
		entry: TafsirEntryWithResource;
	} = $props();
</script>

<div class="rounded-md border border-border p-2 space-y-1">
	<div class="text-xs text-muted-foreground font-medium">
		{entry.source_name_fa} — {entry.author}
	</div>
	<p class="text-sm leading-relaxed" dir="rtl">
		{entry.text}
	</p>
</div>
