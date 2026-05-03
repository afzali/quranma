<script>
	import { cnRtl } from "$lib/utils/rtl-utils.js";
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	} = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cnRtl(
		"whitespace-nowrap bg-clip-padding p-2 align-middle [&:has([role=checkbox])]:pr-0",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</td>