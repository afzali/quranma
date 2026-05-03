<script>
	import { setRtlContext } from '$lib/utils/rtl-context.svelte.js';
	
	let {
		rtl = true,
		lang = 'fa',
		children,
		class: className = '',
		...restProps
	} = $props();
	
	// Set RTL context for child components
	const rtlState = setRtlContext(rtl);
	
	// Update when prop changes
	$effect(() => {
		rtlState.setRtl(rtl);
	});
</script>

<div
	dir={rtl ? 'rtl' : 'ltr'}
	lang={lang}
	class={className}
	style="font-family: 'Vazirmatn', sans-serif;"
	{...restProps}
>
	{@render children?.()}
</div>
