// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Allow importing .sql files as raw strings via Vite's ?raw suffix
declare module '*.sql?raw' {
	const content: string;
	export default content;
}

export {};

