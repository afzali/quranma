<script>
	import { cn } from "$lib/utils/utils.js";
	let { class: className, children, ...restProps } = $props();
</script>

<div
	data-slot="empty"
	class={cn(
		"flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>