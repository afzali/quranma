// UI Context — reactive state for panel visibility and responsive layout
// Uses Svelte 5 runes for reactivity

let navBarVisible = $state(true);
let analysisPanelVisible = $state(true);
let isMobile = $state(false);

export function getNavBarVisible(): boolean {
	return navBarVisible;
}

export function getAnalysisPanelVisible(): boolean {
	return analysisPanelVisible;
}

export function getIsMobile(): boolean {
	return isMobile;
}

export function toggleNavBar(): void {
	navBarVisible = !navBarVisible;
}

export function toggleAnalysisPanel(): void {
	analysisPanelVisible = !analysisPanelVisible;
}

export function setNavBarVisible(value: boolean): void {
	navBarVisible = value;
}

export function setAnalysisPanelVisible(value: boolean): void {
	analysisPanelVisible = value;
}

export function setIsMobile(value: boolean): void {
	isMobile = value;
}
