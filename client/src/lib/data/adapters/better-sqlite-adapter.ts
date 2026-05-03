/**
 * BetterSqliteAdapter — Electron-only adapter that uses better-sqlite3
 * via IPC to the main process.
 *
 * better-sqlite3 is synchronous and only available in Node.js (main process).
 * The preload script exposes a `window.betterSqlite` bridge that forwards
 * calls to the main process via ipcRenderer.invoke / ipcMain.handle.
 *
 * This adapter is used on Electron instead of the CapacitorSQLiteAdapter
 * because the @capacitor-community/sqlite plugin has compatibility issues
 * with the Electron platform.
 */
import type { DatabaseAdapter } from '../database-adapter';

/**
 * Shape of the IPC bridge exposed by the preload script
 * on `window.betterSqlite`.
 */
interface BetterSqliteBridge {
	open(dbName: string): Promise<void>;
	close(): Promise<void>;
	execute(sql: string, params?: unknown[]): Promise<void>;
	query(sql: string, params?: unknown[]): Promise<unknown[]>;
	run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
	transaction(statements: { sql: string; params?: unknown[] }[]): Promise<void>;
	isOpen(): Promise<boolean>;
}

declare global {
	interface Window {
		betterSqlite?: BetterSqliteBridge;
	}
}

export class BetterSqliteAdapter implements DatabaseAdapter {
	private bridge: BetterSqliteBridge;
	private opened = false;

	constructor() {
		if (!window.betterSqlite) {
			throw new Error(
				'BetterSqliteAdapter: window.betterSqlite is not available. ' +
					'This adapter only works in Electron with the preload bridge.'
			);
		}
		this.bridge = window.betterSqlite;
	}

	async open(dbName: string): Promise<void> {
		await this.bridge.open(dbName);
		this.opened = true;
	}

	async close(): Promise<void> {
		await this.bridge.close();
		this.opened = false;
	}

	async execute(sql: string, params?: unknown[]): Promise<void> {
		await this.bridge.execute(sql, params);
	}

	async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
		const rows = await this.bridge.query(sql, params);
		return rows as T[];
	}

	async run(
		sql: string,
		params?: unknown[]
	): Promise<{ changes: number; lastInsertRowId: number }> {
		return this.bridge.run(sql, params);
	}

	async transaction(fn: () => Promise<void>): Promise<void> {
		// The IPC bridge uses a statement-based transaction approach.
		// For the general-purpose transaction(fn) interface, we use
		// BEGIN/COMMIT/ROLLBACK manually via execute calls.
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
		return this.opened;
	}
}
