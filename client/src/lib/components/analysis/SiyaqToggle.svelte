<script lang="ts">
	import { t } from '$lib/i18n';
	import { getShowAllSiyaq, setShowAllSiyaq } from '$lib/state/highlight-context.svelte';

	let showAll = $derived(getShowAllSiyaq());

	function handleToggle() {
		setShowAllSiyaq(!showAll);
	}
</script>

<label class="flex items-center gap-2 cursor-pointer">
	<input
		type="checkbox"
		checked={showAll}
		onchange={handleToggle}
		class="rounded border-input"
	/>
	<span class="text-sm">{t('siyaq.show_all')}</span>
</label>
