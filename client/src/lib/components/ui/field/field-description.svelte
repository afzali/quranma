<script>
	import { cn } from "$lib/utils/utils.js";
	let {
		class: className,
		children,
		...restProps
	} = $props();
</script>

<p
	data-slot="field-description"
	class={cn(
		"text-muted-foreground text-sm font-normal leading-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
		"nth-last-2:-mt-1 last:mt-0 [[data-variant=legend]+&]:-mt-1.5",
		"[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</p>