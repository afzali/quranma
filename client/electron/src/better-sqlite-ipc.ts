/**
 * IPC handlers for better-sqlite3 database operations.
 *
 * better-sqlite3 is synchronous and only runs in the Electron main process.
 * This module registers ipcMain handlers so the renderer (SvelteKit app)
 * can execute database operations via IPC.
 */
import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs';

// better-sqlite3 types
type BetterSqlite3Database = import('better-sqlite3').Database;

let db: BetterSqlite3Database | null = null;

/**
 * Register all IPC handlers for SQLite operations.
 * Call this once during app initialization (before windows are created).
 */
export function registerSqliteIpcHandlers(): void {
  ipcMain.handle('better-sqlite:open', (_event, dbName: string) => {
    return openDatabase(dbName);
  });

  ipcMain.handle('better-sqlite:close', () => {
    return closeDatabase();
  });

  ipcMain.handle('better-sqlite:execute', (_event, sql: string, params?: unknown[]) => {
    return executeStatement(sql, params);
  });

  ipcMain.handle('better-sqlite:query', (_event, sql: string, params?: unknown[]) => {
    return queryRows(sql, params);
  });

  ipcMain.handle('better-sqlite:run', (_event, sql: string, params?: unknown[]) => {
    return runStatement(sql, params);
  });

  ipcMain.handle('better-sqlite:transaction', (_event, statements: { sql: string; params?: unknown[] }[]) => {
    return runTransaction(statements);
  });

  ipcMain.handle('better-sqlite:isOpen', () => {
    return db !== null && db.open;
  });
}

function openDatabase(dbName: string): void {
  if (db?.open) return; // Already open

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');

  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'databases');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, `${dbName}.db`);

  // Copy bundled database from app assets if it doesn't exist yet
  if (!fs.existsSync(dbPath)) {
    const appPath = app.getAppPath();
    // In the packaged Electron app, assets are at <appPath>/app/assets/
    // In dev mode, they may be at <appPath>/app/assets/ as well (after cap sync)
    const bundledDbPath = path.join(appPath, 'app', 'assets', `${dbName}.db`);

    if (fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, dbPath);
      console.log(`Copied bundled database from ${bundledDbPath} to ${dbPath}`);
    } else {
      console.warn(`Bundled database not found at ${bundledDbPath}, creating empty database`);
    }
  }

  db = new Database(dbPath);
  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  console.log(`Database opened at ${dbPath}`);
}

function closeDatabase(): void {
  if (db?.open) {
    db.close();
    db = null;
    console.log('Database closed');
  }
}

function executeStatement(sql: string, params?: unknown[]): void {
  ensureOpen();
  if (params && params.length > 0) {
    db!.prepare(sql).run(...params);
  } else {
    db!.exec(sql);
  }
}

function queryRows(sql: string, params?: unknown[]): unknown[] {
  ensureOpen();
  const stmt = db!.prepare(sql);
  if (params && params.length > 0) {
    return stmt.all(...params);
  }
  return stmt.all();
}

function runStatement(sql: string, params?: unknown[]): { changes: number; lastInsertRowId: number } {
  ensureOpen();
  const stmt = db!.prepare(sql);
  const result = params && params.length > 0 ? stmt.run(...params) : stmt.run();
  return {
    changes: result.changes,
    lastInsertRowId: Number(result.lastInsertRowid)
  };
}

function runTransaction(statements: { sql: string; params?: unknown[] }[]): void {
  ensureOpen();
  const txn = db!.transaction(() => {
    for (const { sql, params } of statements) {
      if (params && params.length > 0) {
        db!.prepare(sql).run(...params);
      } else {
        db!.exec(sql);
      }
    }
  });
  txn();
}

function ensureOpen(): void {
  if (!db || !db.open) {
    throw new Error('Database is not open. Call open() first.');
  }
}
