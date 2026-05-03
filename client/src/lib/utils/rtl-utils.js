import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * RTL-aware class name utility
 * Automatically converts directional classes to RTL equivalents
 */
export function cnRtl(...inputs) {
	const merged = twMerge(clsx(inputs));
	return convertToRtl(merged);
}

/**
 * Convert LTR directional classes to RTL
 */
function convertToRtl(classNames) {
	if (!classNames) return classNames;
	
	let result = classNames;
	const original = classNames;
	
	// First, handle simple translate-x-px
	// In RTL: -translate-x-px becomes translate-x-px (remove negative)
	// and translate-x-px becomes -translate-x-px (add negative)
	result = result.replace(/\b-translate-x-px\b/g, '__RTL_REMOVE_NEG__');
	result = result.replace(/\btranslate-x-px\b/g, '-translate-x-px');
	result = result.replace(/__RTL_REMOVE_NEG__/g, 'translate-x-px');
	
	// Handle border-l and border-r (without suffix)
	result = result.replace(/\bborder-l\b/g, '__RTL_BORDER_L__');
	result = result.replace(/\bborder-r\b/g, 'border-l');
	result = result.replace(/__RTL_BORDER_L__/g, 'border-r');
	
	// Handle ml-auto and mr-auto (must be before ml- and mr-)
	result = result.replace(/\bml-auto\b/g, '__RTL_ML_AUTO__');
	result = result.replace(/\bmr-auto\b/g, 'ml-auto');
	result = result.replace(/__RTL_ML_AUTO__/g, 'mr-auto');
	
	// Handle text-left and text-right swap
	result = result.replace(/\btext-left\b/g, '__RTL_TEXT_LEFT__');
	result = result.replace(/\btext-right\b/g, 'text-left');
	result = result.replace(/__RTL_TEXT_LEFT__/g, 'text-right');
	
	// Handle left-[...] and right-[...] arbitrary values
	// BUT skip left-[50%] which is used for centering
	result = result.replace(/\bleft-(\[[^\]]+\])/g, (match, value) => {
		if (value === '[50%]') return match; // Don't convert centering
		return '__RTL_LEFT__' + value;
	});
	result = result.replace(/\bright-(\[[^\]]+\])/g, 'left-$1');
	result = result.replace(/__RTL_LEFT__/g, 'right-');
	
	// Handle translate-x with arbitrary values - must be done AFTER other mappings
	// to avoid conflicts. We'll mark them first, then convert at the end.
	
	// Mark translate-x patterns that need flipping
	result = result.replace(
		/(data-\[state=checked\]:)translate-x-(\[[^\]]+\])/g,
		'$1__RTL_FLIP__translate-x-$2'
	);
	
	// General translate-x-[...] patterns (not part of data-[state)
	// Also handle negative translate-x like -translate-x-[-50%]
	// BUT skip translate-x-[-50%] which is used for centering
	result = result.replace(
		/(?<!data-\[state=(?:checked|unchecked)\]:)(?<!__RTL_FLIP__)(-?)translate-x-(\[[^\]]+\])/g,
		(match, minus, value) => {
			// Skip centering transforms
			if (value === '[-50%]' || value === '[50%]') return match;
			// If it has minus, remove it; if not, add it
			return minus ? `__RTL_FLIP__translate-x-${value}` : `__RTL_FLIP__-translate-x-${value}`;
		}
	);
	
	const rtlMappings = {
		
		// Padding
		'pl-': 'pr-',
		'pr-': 'pl-',
		'ps-': 'pe-',
		'pe-': 'ps-',
		
		// Margin (ml-auto and mr-auto are handled above separately)
		'ml-': 'mr-',
		'mr-': 'ml-',
		'ms-': 'me-',
		'me-': 'ms-',
		
		// Border (border-l and border-r are handled above separately)
		'border-s': 'border-e',
		'border-e': 'border-s',
		
		// Rounded corners
		'rounded-l': 'rounded-r',
		'rounded-r': 'rounded-l',
		'rounded-tl': 'rounded-tr',
		'rounded-tr': 'rounded-tl',
		'rounded-bl': 'rounded-br',
		'rounded-br': 'rounded-bl',
		'rounded-s': 'rounded-e',
		'rounded-e': 'rounded-s',
		
		// Position
		'left-': 'right-',
		'right-': 'left-',
		'start-': 'end-',
		'end-': 'start-',
		
		// Inset
		'inset-x-': 'inset-x-', // No change needed
		
		// Text align
		'text-left': 'text-right',
		// Note: text-right stays as text-right (no conversion needed)
		'text-start': 'text-end',
		'text-end': 'text-start',
		
		// Flex & Grid
		'justify-start': 'justify-end',
		'justify-end': 'justify-start',
		'items-start': 'items-end',
		'items-end': 'items-start',
		
		// Transforms (handled by regex above, not here)
		
		// Animations - slide directions
		'slide-in-from-left': 'slide-in-from-right',
		'slide-in-from-right': 'slide-in-from-left',
		'slide-out-to-left': 'slide-out-to-right',
		'slide-out-to-right': 'slide-out-to-left',
	};
	
	// Apply RTL mappings
	for (const [ltr, rtl] of Object.entries(rtlMappings)) {
		// Use word boundary to match complete class names
		const escapedLtr = ltr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		const regex = new RegExp(`\\b${escapedLtr}(?=\\s|$)`, 'g');
		result = result.replace(regex, rtl);
	}
	
	// Finally, convert marked translate-x - remove the marker
	result = result.replace(/__RTL_FLIP__/g, '');
	
	// Debug log
	if (original.includes('border-l') || original.includes('translate-x') || original.includes('left-[') || original.includes('right-[')) {
		console.log('RTL Conversion:');
		console.log('  Original:', original);
		console.log('  Result:  ', result);
		console.log('  Changed: ', original !== result);
	}
	
	return result;
}

/**
 * Get RTL-aware directional value
 * Usage: dir('left', 'right') returns 'right' in RTL
 */
export function dir(ltrValue, rtlValue) {
	return rtlValue; // Always return RTL value
}

/**
 * Flip numeric value for RTL (useful for transforms)
 */
export function flipValue(value) {
	if (typeof value === 'number') {
		return -value;
	}
	if (typeof value === 'string' && value.startsWith('-')) {
		return value.substring(1);
	}
	if (typeof value === 'string') {
		return `-${value}`;
	}
	return value;
}

/**
 * RTL-aware style object
 */
export function rtlStyle(styles) {
	const rtlStyles = { ...styles };
	
	// Swap left/right properties
	if (styles.left !== undefined) {
		rtlStyles.right = styles.left;
		delete rtlStyles.left;
	}
	if (styles.right !== undefined) {
		rtlStyles.left = styles.right;
		delete rtlStyles.right;
	}
	
	// Swap padding
	if (styles.paddingLeft !== undefined) {
		rtlStyles.paddingRight = styles.paddingLeft;
		delete rtlStyles.paddingLeft;
	}
	if (styles.paddingRight !== undefined) {
		rtlStyles.paddingLeft = styles.paddingRight;
		delete rtlStyles.paddingRight;
	}
	
	// Swap margin
	if (styles.marginLeft !== undefined) {
		rtlStyles.marginRight = styles.marginLeft;
		delete rtlStyles.marginLeft;
	}
	if (styles.marginRight !== undefined) {
		rtlStyles.marginLeft = styles.marginRight;
		delete rtlStyles.marginRight;
	}
	
	return rtlStyles;
}
