<script lang="ts">
	import { t } from '$lib/i18n';

	let {
		value = $bindable(''),
		oninput
	}: {
		value?: string;
		oninput?: (value: string) => void;
	} = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		oninput?.(value);
	}

	function handleClear() {
		value = '';
		oninput?.('');
	}
</script>

<div class="relative px-3 py-2">
	<input
		type="text"
		{value}
		oninput={handleInput}
		placeholder={t('search.placeholder')}
		class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
		dir="auto"
	/>
	{#if value.length > 0}
		<button
			type="button"
			class="absolute end-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
			onclick={handleClear}
			aria-label="Clear search"
		>
			<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M18 6 6 18" /><path d="m6 6 12 12" />
			</svg>
		</button>
	{/if}
</div>
