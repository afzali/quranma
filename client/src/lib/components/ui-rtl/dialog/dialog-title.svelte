<script>
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cnRtl } from "$lib/utils/rtl-utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	} = $props();
</script>

<DialogPrimitive.Title
	bind:ref
	data-slot="dialog-title"
	class={cnRtl("text-lg font-semibold leading-none text-right", className)}
	{...restProps}
/>