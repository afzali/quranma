<script lang="ts">
	import { getLocale, setLocale } from '$lib/state/i18n-context.svelte';

	let currentLocale = $derived(getLocale());

	function toggle() {
		setLocale(currentLocale === 'fa' ? 'en' : 'fa');
	}
</script>

<button
	onclick={toggle}
	class="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
	aria-label={currentLocale === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
>
	{currentLocale === 'fa' ? 'EN' : 'فا'}
</button>
