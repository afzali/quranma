<script>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { cnRtl } from "$lib/utils/rtl-utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	} = $props();
</script>

<AlertDialogPrimitive.Description
	bind:ref
	data-slot="alert-dialog-description"
	class={cnRtl("text-muted-foreground text-sm text-right", className)}
	{...restProps}
/>