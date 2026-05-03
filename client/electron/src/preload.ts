require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below
console.log('User Preload!');

import { contextBridge, ipcRenderer } from 'electron';

// Expose better-sqlite3 IPC bridge to the renderer process.
// This allows the SvelteKit app to call database operations
// without needing nodeIntegration in the renderer.
contextBridge.exposeInMainWorld('betterSqlite', {
  open: (dbName: string) => ipcRenderer.invoke('better-sqlite:open', dbName),
  close: () => ipcRenderer.invoke('better-sqlite:close'),
  execute: (sql: string, params?: unknown[]) => ipcRenderer.invoke('better-sqlite:execute', sql, params),
  query: (sql: string, params?: unknown[]) => ipcRenderer.invoke('better-sqlite:query', sql, params),
  run: (sql: string, params?: unknown[]) => ipcRenderer.invoke('better-sqlite:run', sql, params),
  transaction: (statements: { sql: string; params?: unknown[] }[]) =>
    ipcRenderer.invoke('better-sqlite:transaction', statements),
  isOpen: () => ipcRenderer.invoke('better-sqlite:isOpen')
});
