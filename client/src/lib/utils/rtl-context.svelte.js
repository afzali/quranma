import { getContext, setContext } from 'svelte';

const RTL_CONTEXT_KEY = Symbol('rtl');

/**
 * RTL Context State
 */
class RtlState {
	isRtl = $state(true);
	
	constructor(initialRtl = true) {
		this.isRtl = initialRtl;
	}
	
	toggle() {
		this.isRtl = !this.isRtl;
	}
	
	setRtl(value) {
		this.isRtl = value;
	}
}

/**
 * Set RTL context
 */
export function setRtlContext(isRtl = true) {
	const state = new RtlState(isRtl);
	setContext(RTL_CONTEXT_KEY, state);
	return state;
}

/**
 * Get RTL context
 */
export function getRtlContext() {
	return getContext(RTL_CONTEXT_KEY);
}

/**
 * Check if current context is RTL
 */
export function isRtl() {
	const context = getRtlContext();
	return context?.isRtl ?? true; // Default to RTL
}
