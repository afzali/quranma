<script>
	import { cn } from "$lib/utils/utils.js";
	let { class: className, children, ...restProps } = $props();
</script>

<div
	data-slot="field-content"
	class={cn("group/field-content flex flex-1 flex-col gap-1.5 leading-snug", className)}
	{...restProps}
>
	{@render children?.()}
</div>