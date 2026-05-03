<script>
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cnRtl } from "$lib/utils/rtl-utils.js";
	let {
		ref = $bindable(null),
		class: className,
		inset,
		...restProps
	} = $props();
</script>

<DropdownMenuPrimitive.GroupHeading
	bind:ref
	data-slot="dropdown-menu-group-heading"
	data-inset={inset}
	class={cnRtl("px-2 py-1.5 text-sm font-semibold data-[inset]:pl-8", className)}
	{...restProps}
/>