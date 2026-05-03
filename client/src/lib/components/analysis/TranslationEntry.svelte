<script lang="ts">
	import type { TranslationEntryWithResource } from '$lib/data/repositories/resource-repository';

	let {
		entry
	}: {
		entry: TranslationEntryWithResource;
	} = $props();
</script>

<div class="rounded-md border border-border p-2 space-y-1">
	<div class="flex items-center justify-between text-xs text-muted-foreground">
		<span class="font-medium">{entry.translator_name}</span>
		<span>{entry.translator_language}</span>
	</div>
	<p class="text-sm leading-relaxed" dir={entry.translator_language === 'fa' || entry.translator_language === 'ar' ? 'rtl' : 'ltr'}>
		{entry.text}
	</p>
</div>
