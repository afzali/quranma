<script>
	import { cn } from "$lib/utils/utils.js";
	let { class: className, children, ...restProps } = $props();
</script>

<div
	data-slot="empty-header"
	class={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)}
	{...restProps}
>
	{@render children?.()}
</div>