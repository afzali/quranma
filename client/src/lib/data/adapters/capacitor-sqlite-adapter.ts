import {
	CapacitorSQLite,
	SQLiteConnection,
	type SQLiteDBConnection
} from '@capacitor-community/sqlite';
import type { DatabaseAdapter } from '../database-adapter';

/**
 * Capacitor SQLite adapter — works on Electron (better-sqlite3),
 * Android, and iOS via @capacitor-community/sqlite.
 *
 * On first launch, copies the bundled quranoma.db from assets
 * using copyFromAssets, then opens it as the app database.
 */
export class CapacitorSQLiteAdapter implements DatabaseAdapter {
	private sqlite: SQLiteConnection;
	private db: SQLiteDBConnection | null = null;
	private dbName: string = '';

	constructor() {
		this.sqlite = new SQLiteConnection(CapacitorSQLite);
	}

	async open(dbName: string): Promise<void> {
		this.dbName = dbName;

		// Copy the bundled database from assets on first launch.
		// copyFromAssets looks for <dbName>.db in the app's assets folder.
		// If the database already exists on disk, this is a no-op.
		try {
			await this.sqlite.copyFromAssets(false);
		} catch (e) {
			// copyFromAssets may throw if files already exist — that's fine
			console.warn('copyFromAssets:', e);
		}

		const ret = await this.sqlite.checkConnectionsConsistency();
		const isConn = (await this.sqlite.isConnection(dbName, false)).result;

		if (ret.result && isConn) {
			this.db = await this.sqlite.retrieveConnection(dbName, false);
		} else {
			this.db = await this.sqlite.createConnection(dbName, false, 'no-encryption', 1, false);
		}

		await this.db.open();
	}

	async close(): Promise<void> {
		if (this.db) {
			await this.db.close();
			await this.sqlite.closeConnection(this.dbName, false);
			this.db = null;
		}
	}

	async execute(sql: string, params?: unknown[]): Promise<void> {
		this.ensureOpen();
		if (params && params.length > 0) {
			// execute() doesn't support params — use run() for parameterized statements
			await this.db!.run(sql, params as any[], false);
		} else {
			await this.db!.execute(sql, false);
		}
	}

	async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
		this.ensureOpen();
		const result = await this.db!.query(sql, params as any[] | undefined);
		return (result.values ?? []) as T[];
	}

	async run(
		sql: string,
		params?: unknown[]
	): Promise<{ changes: number; lastInsertRowId: number }> {
		this.ensureOpen();
		const result = await this.db!.run(sql, params as any[] | undefined, false);
		return {
			changes: result.changes?.changes ?? 0,
			lastInsertRowId: result.changes?.lastId ?? 0
		};
	}

	async transaction(fn: () => Promise<void>): Promise<void> {
		this.ensureOpen();
		await this.execute('BEGIN TRANSACTION');
		try {
			await fn();
			await this.execute('COMMIT');
		} catch (error) {
			await this.execute('ROLLBACK');
			throw error;
		}
	}

	isOpen(): boolean {
		return this.db !== null;
	}

	private ensureOpen(): void {
		if (!this.db) {
			throw new Error('Database is not open. Call open() first.');
		}
	}
}
