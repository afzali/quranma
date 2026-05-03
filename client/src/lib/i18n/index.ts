import fa from './fa';
import en from './en';
import { getLocale } from '$lib/state/i18n-context.svelte';

const translations: Record<string, Record<string, string>> = { fa, en };

export function t(key: string): string {
	const locale = getLocale();
	return translations[locale]?.[key] ?? key;
}
