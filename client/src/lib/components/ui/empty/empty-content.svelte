<script>
	import { cn } from "$lib/utils/utils.js";
	let { class: className, children, ...restProps } = $props();
</script>

<div
	data-slot="empty-content"
	class={cn(
		"flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>