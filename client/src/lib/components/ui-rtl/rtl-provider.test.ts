import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RtlProvider from './rtl-provider.svelte';

describe('RtlProvider', () => {
	it('renders with RTL direction by default', () => {
		const { container } = render(RtlProvider, {
			props: { rtl: true, lang: 'fa' },
		});

		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper).toBeTruthy();
		expect(wrapper.getAttribute('dir')).toBe('rtl');
		expect(wrapper.getAttribute('lang')).toBe('fa');
	});

	it('renders with LTR direction when rtl is false', () => {
		const { container } = render(RtlProvider, {
			props: { rtl: false, lang: 'en' },
		});

		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper).toBeTruthy();
		expect(wrapper.getAttribute('dir')).toBe('ltr');
		expect(wrapper.getAttribute('lang')).toBe('en');
	});

	it('applies Vazirmatn font family', () => {
		const { container } = render(RtlProvider, {
			props: { rtl: true, lang: 'fa' },
		});

		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.style.fontFamily).toContain('Vazirmatn');
	});

	it('passes through custom class names', () => {
		const { container } = render(RtlProvider, {
			props: { rtl: true, lang: 'fa', class: 'custom-class' },
		});

		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.classList.contains('custom-class')).toBe(true);
	});

	it('toggles direction when rtl prop changes', async () => {
		const { container, rerender } = render(RtlProvider, {
			props: { rtl: true, lang: 'fa' },
		});

		let wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.getAttribute('dir')).toBe('rtl');

		// Re-render with LTR
		await rerender({ rtl: false, lang: 'en' });

		wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.getAttribute('dir')).toBe('ltr');
		expect(wrapper.getAttribute('lang')).toBe('en');
	});
});
