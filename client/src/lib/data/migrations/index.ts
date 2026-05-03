import type { DatabaseAdapter } from '../database-adapter';
import initialSql from './001-initial.sql?raw';
import coursesSql from './002-courses.sql?raw';
import analysisSql from './003-analysis.sql?raw';

interface Migration {
	version: number;
	sql: string;
	/** Optional post-migration hook (e.g. additional setup). */
	afterApply?: (adapter: DatabaseAdapter) => Promise<void>;
}

/**
 * List of migrations to apply in order.
 * The bundled quranoma.db already contains the full Quran data schema.
 * These migrations add application-specific tables on top.
 */
export const migrations: Migration[] = [
	{
		version: 1,
		sql: initialSql
	},
	{
		version: 2,
		sql: coursesSql
	},
	{
		version: 3,
		sql: analysisSql
	}
];

/**
 * Run all pending migrations. Checks the current db_version in
 * APP_SETTINGS and applies any migrations with a higher version number.
 */
export async function runMigrations(adapter: DatabaseAdapter): Promise<void> {
	const currentVersion = await getCurrentVersion(adapter);

	for (const migration of migrations) {
		if (migration.version > currentVersion) {
			// Split multi-statement SQL and execute each statement
			const statements = migration.sql
				.split(';')
				.map((s) => s.trim())
				.filter((s) => s.length > 0);

			for (const statement of statements) {
				await adapter.execute(statement);
			}

			// Run post-migration hook if present
			if (migration.afterApply) {
				await migration.afterApply(adapter);
			}

			// Update the stored version
			await adapter.run(
				"INSERT OR REPLACE INTO APP_SETTINGS (key, value) VALUES ('db_version', ?)",
				[String(migration.version)]
			);
		}
	}
}

/**
 * Read the current database version from APP_SETTINGS.
 * Returns 0 if the table doesn't exist yet (fresh database).
 */
async function getCurrentVersion(adapter: DatabaseAdapter): Promise<number> {
	try {
		const rows = await adapter.query<{ value: string }>(
			"SELECT value FROM APP_SETTINGS WHERE key = 'db_version'"
		);
		if (rows.length > 0) {
			return parseInt(rows[0].value, 10) || 0;
		}
	} catch {
		// Table doesn't exist yet — this is a fresh/bundled database
	}
	return 0;
}
