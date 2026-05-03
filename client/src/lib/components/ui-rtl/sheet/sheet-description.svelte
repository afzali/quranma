<script>
	import { Dialog as SheetPrimitive } from "bits-ui";
	import { cnRtl } from "$lib/utils/rtl-utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	} = $props();
</script>

<SheetPrimitive.Description
	bind:ref
	data-slot="sheet-description"
	class={cnRtl("text-muted-foreground text-sm text-right", className)}
	{...restProps}
/>