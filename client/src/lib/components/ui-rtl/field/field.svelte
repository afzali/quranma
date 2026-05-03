<script module>
	import { tv } from "tailwind-variants";

	const fieldVariants = tv({
		base: "group/field data-[invalid=true]:text-destructive flex w-full gap-3",
		variants: {
			orientation: {
				vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
				horizontal: [
					"flex-row items-center",
					"[&>[data-slot=field-label]]:flex-auto",
					"has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px has-[>[data-slot=field-content]]:items-start",
				],
				responsive: [
					"@md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto flex-col [&>*]:w-full [&>.sr-only]:w-auto",
					"@md/field-group:[&>[data-slot=field-label]]:flex-auto",
					"@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
				],
			},
		},
		defaultVariants: {
			orientation: "vertical",
		},
	});
</script>

<script>
	import { cnRtl } from "$lib/utils/rtl-utils.js";
	let {
		class: className,
		orientation = "vertical",
		children,
		...restProps
	} = $props();
</script>

<div
	role="group"
	data-slot="field"
	data-orientation={orientation}
	class={cnRtl(fieldVariants({ orientation }), className)}
	{...restProps}
>
	{@render children?.()}
</div>