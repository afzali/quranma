<script>
	import { cnRtl } from "$lib/utils/rtl-utils.js";
	let {
		ref = $bindable(null),
		class: className,
		inset,
		children,
		...restProps
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="dropdown-menu-label"
	data-inset={inset}
	class={cnRtl("px-2 py-1.5 text-sm font-semibold text-right data-[inset]:pr-8", className)}
	{...restProps}
>
	{@render children?.()}
</div>