// I18n Context — reactive state for locale and text direction
// Uses Svelte 5 runes for reactivity

export type Locale = 'fa' | 'en';
export type Direction = 'rtl' | 'ltr';

let locale = $state<Locale>('fa');
let direction = $derived<Direction>(locale === 'fa' ? 'rtl' : 'ltr');

export function getLocale(): Locale {
	return locale;
}

export function getDirection(): Direction {
	return direction;
}

export function setLocale(newLocale: Locale): void {
	locale = newLocale;
}
