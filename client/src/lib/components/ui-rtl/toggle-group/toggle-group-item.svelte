<script>
	import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";
	import { getToggleGroupCtx } from "./toggle-group.svelte";
	import { cnRtl } from "$lib/utils/rtl-utils.js";
	import { toggleVariants } from "$lib/components/ui/toggle/index.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size,
		variant,
		...restProps
	} = $props();

	const ctx = getToggleGroupCtx();
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	data-slot="toggle-group-item"
	data-variant={ctx.variant || variant}
	data-size={ctx.size || size}
	class={cnRtl(
		toggleVariants({
			variant: ctx.variant || variant,
			size: ctx.size || size,
		}),
		"min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-r-md last:rounded-l-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
		className
	)}
	{value}
	{...restProps}
/>