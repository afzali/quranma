<script>
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cnRtl } from "$lib/utils/rtl-utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	} = $props();
</script>

<DialogPrimitive.Description
	bind:ref
	data-slot="dialog-description"
	class={cnRtl("text-muted-foreground text-sm text-right", className)}
	{...restProps}
/>