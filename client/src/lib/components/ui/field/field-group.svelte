<script>
	import { cn } from "$lib/utils/utils.js";
	let { class: className, children, ...restProps } = $props();
</script>

<div
	data-slot="field-group"
	class={cn(
		"group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>