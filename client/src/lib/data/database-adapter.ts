/**
 * DatabaseAdapter interface — abstracts SQLite operations so that
 * different implementations (Capacitor plugin, wa-sqlite, sql.js)
 * can be swapped without changing business logic.
 */
export interface QueryResult {
	values: Record<string, unknown>[];
}

export interface DatabaseAdapter {
	/** Open the database connection for the given database name. */
	open(dbName: string): Promise<void>;

	/** Close the database connection. */
	close(): Promise<void>;

	/** Execute a SQL statement (no return value). */
	execute(sql: string, params?: unknown[]): Promise<void>;

	/** Run a query and return all matching rows. */
	query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;

	/** Run a SQL statement and return change metadata. */
	run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;

	/** Execute a function inside a transaction. Rolls back on error. */
	transaction(fn: () => Promise<void>): Promise<void>;

	/** Check whether the database connection is currently open. */
	isOpen(): boolean;
}
