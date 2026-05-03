import type { LayoutLoad } from './$types';

/**
 * Auth guard placeholder for the (app) layout group.
 * In Phase 4, this will check authentication status and redirect
 * unauthenticated users to the login page.
 * For now, it passes through without checking auth.
 */
export const load: LayoutLoad = async () => {
	// Phase 4: Uncomment to enable auth guard
	// const isAuthenticated = await checkAuth();
	// if (!isAuthenticated) {
	//   throw redirect(302, '/login');
	// }
	return {};
};
