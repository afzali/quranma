import type { DatabaseAdapter } from './database-adapter';
import { createAdapter } from './adapters';
import { runMigrations } from './migrations';

/**
 * The database name used by the app.
 * On first launch, the bundled quranoma.db is copied from assets
 * and opened under this name.
 */
const DB_NAME = 'quranoma';

let adapter: DatabaseAdapter | null = null;

/**
 * Initialize the database: create the adapter, open the connection
 * (copying the bundled database from assets on first launch),
 * and run any pending migrations.
 */
export async function initDatabase(): Promise<void> {
	if (adapter?.isOpen()) return; // Already initialized

	adapter = createAdapter();
	await adapter.open(DB_NAME);
	await runMigrations(adapter);
}

/**
 * Get the active DatabaseAdapter instance.
 * Throws if the database has not been initialized yet.
 */
export function getDb(): DatabaseAdapter {
	if (!adapter) {
		throw new Error('Database not initialized. Call initDatabase() first.');
	}
	return adapter;
}
