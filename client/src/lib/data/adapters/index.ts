import { Capacitor } from '@capacitor/core';
import type { DatabaseAdapter } from '../database-adapter';
import { CapacitorSQLiteAdapter } from './capacitor-sqlite-adapter';

/**
 * Factory function that selects the appropriate DatabaseAdapter
 * based on the current Capacitor platform.
 *
 * - Electron, Android, iOS → CapacitorSQLiteAdapter
 * - Web → not yet implemented (future: wa-sqlite or sql.js adapter)
 */
export function createAdapter(): DatabaseAdapter {
	const platform = Capacitor.getPlatform();

	if (platform === 'electron' || platform === 'android' || platform === 'ios') {
		return new CapacitorSQLiteAdapter();
	}

	// Future: return new WaSQLiteAdapter() for web/dev mode
	throw new Error(
		`No database adapter available for platform: "${platform}". Web adapter not yet implemented.`
	);
}
