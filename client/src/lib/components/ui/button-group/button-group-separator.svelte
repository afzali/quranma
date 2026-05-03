<script>
	import { cn } from "$lib/utils/utils.js";
	import { Separator } from "$lib/components/ui/separator/index.js";

	let {
		class: className,
		orientation = "vertical",
		...restProps
	} = $props();
</script>

<Separator
	data-slot="button-group-separator"
	{orientation}
	class={cn("bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto", className)}
	{...restProps}
/>