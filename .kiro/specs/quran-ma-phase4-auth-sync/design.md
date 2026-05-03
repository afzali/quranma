# Design Document — Quran Ma Phase 4: Authentication and Sync

## Overview

Phase 4 adds optional authentication against a PHP backend and bidirectional data synchronization. The architecture extends the existing four-layer pattern (UI → State → Service → DAL) with new auth and sync modules. A network status context detects connectivity changes via @capacitor/network. All sync operations are course-scoped and use a local queue for offline resilience. Conflict resolution uses sync_version comparison and prompts the user to choose between local and remote versions.

### Key Design Decisions

1. **Token in APP_SETTINGS**: The Auth_Token is stored as a key-value pair in the existing APP_SETTINGS table rather than a separate table. This keeps the schema simple and reuses the existing settings infrastructure.

2. **SYNC_QUEUE for offline resilience**: Every mutation to syncable data (when authenticated) inserts a queue entry. The queue is processed FIFO when online. This decouples data writes from network availability.

3. **sync_version for conflict detection**: Each syncable table already has a sync_version column (added in Phase 2/3). The server increments sync_version on each write. When the client sends a change with a stale sync_version, the server returns 409 Conflict with the current remote data.

4. **@capacitor/network for connectivity**: The Capacitor Network plugin provides cross-platform online/offline detection with change listeners. On Electron it uses Node.js net module.

5. **Resource list from server**: On startup (when online), the app fetches the current list of available Translation and Tafsir resources from the PHP backend and upserts into local TRANSLATION_RESOURCE and TAFSIR_RESOURCE tables. Downloads use the download_url from these records.

6. **No SvelteKit routes for login**: The Login_Page is a Svelte component rendered conditionally, not a separate SvelteKit route. The app remains a single-page application.

7. **Exponential backoff for server errors**: Sync retries use 1s, 2s, 4s, 8s, 16s (capped at 30s) with max 5 attempts per queue entry before pausing.

## Architecture

### Extended Architecture (Phase 4 additions in bold)

```
┌──────────────────────────────────────────────────┐
│              SvelteKit SPA                        │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │  UI Layer                                  │   │
│  │  Phase 1-3: existing components            │   │
│  │  Phase 4: LoginPage, UserProfile,          │   │
│  │           NetworkIndicator,                │   │
│  │           ConflictDialog                   │   │
│  └──────────┬────────────────────────────────┘   │
│             │                                     │
│  ┌──────────▼────────────────────────────────┐   │
│  │  State Layer                               │   │
│  │  Phase 1-3: selection, i18n, ui, course,   │   │
│  │             highlight                      │   │
│  │  Phase 4: auth-context, network-context,   │   │
│  │           sync-context                     │   │
│  └──────────┬────────────────────────────────┘   │
│             │                                     │
│  ┌──────────▼────────────────────────────────┐   │
│  │  Service Layer                             │   │
│  │  Phase 1-3: quran, search, highlight,      │   │
│  │             resource                       │   │
│  │  Phase 4: auth-service, sync-service,      │   │
│  │           api-client                       │   │
│  └──────────┬────────────────────────────────┘   │
│             │                                     │
│  ┌──────────▼────────────────────────────────┐   │
│  │  Data Access Layer                         │   │
│  │  Phase 1-3: existing repositories          │   │
│  │  Phase 4: sync-queue-repository            │   │
│  └──────────┬────────────────────────────────┘   │
│             │                                     │
│  ┌──────────▼────────────────────────────────┐   │
│  │  @capacitor-community/sqlite               │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
└──────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌────────────────────┐
│ Capacitor        │  │  PHP Backend (REST) │
│ Electron/Network │  │  /api/auth/login    │
│                  │  │  /api/auth/logout   │
│                  │  │  /api/sync/push     │
│                  │  │  /api/sync/pull     │
│                  │  │  /api/resources     │
└─────────────────┘  └────────────────────┘
```


## Components and Interfaces

### Updated Component Hierarchy (Phase 4 additions marked with *)

```
+layout.svelte (*NetworkInit, *AuthInit)
└── +page.svelte (AppShell)
    ├── *LoginPage (shown when navigating to login)
    ├── *ConflictDialog (modal, shown when conflicts exist)
    ├── PaneGroup
    │   ├── Pane (Analysis — left)
    │   │   └── AnalysisTabs (Phase 3)
    │   ├── PaneResizer
    │   ├── Pane (Quran Display — center)
    │   │   └── QuranDisplay (Phase 1)
    │   ├── PaneResizer
    │   └── Pane (Navigation — right)
    │       └── NavigationBar
    │           ├── *UserProfile / *LoginButton
    │           ├── *NetworkIndicator
    │           ├── *SyncStatusIndicator
    │           ├── CourseSwitcher (Phase 2)
    │           ├── NavigationTabs (Phase 2)
    │           └── LanguageSwitcher (Phase 1)
    └── MobileOverlay
```

### Key Component Interfaces

#### LoginPage.svelte

```svelte
<script lang="ts">
  import { login } from '$lib/services/auth-service';
  import { getIsAuthenticated } from '$lib/state/auth-context.svelte';
  import { t } from '$lib/i18n';

  let username = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let loading = $state(false);
  let showLogin = $state(false);

  async function handleSubmit() {
    loading = true;
    error = null;
    try {
      await login(username, password);
      showLogin = false;
    } catch (e) {
      error = e instanceof Error ? e.message : t('auth.login_failed');
    } finally {
      loading = false;
    }
  }
</script>
```

#### UserProfile.svelte

```svelte
<script lang="ts">
  import { getIsAuthenticated, getUsername } from '$lib/state/auth-context.svelte';
  import { logout } from '$lib/services/auth-service';
  import { t } from '$lib/i18n';

  let isAuthenticated = $derived(getIsAuthenticated());
  let username = $derived(getUsername());
</script>

<!-- Shows username + logout button when authenticated, login button when not -->
```

#### NetworkIndicator.svelte

```svelte
<script lang="ts">
  import { getIsOnline } from '$lib/state/network-context.svelte';
  import { t } from '$lib/i18n';

  let isOnline = $derived(getIsOnline());
</script>

<!-- Shows a small dot/icon: green when online, red/gray when offline -->
```

#### SyncStatusIndicator.svelte

```svelte
<script lang="ts">
  import { getSyncStatus, getConflictCount } from '$lib/state/sync-context.svelte';
  import { t } from '$lib/i18n';

  let syncStatus = $derived(getSyncStatus());
  let conflictCount = $derived(getConflictCount());
</script>

<!-- Shows sync icon (spinning when syncing), conflict badge when conflicts > 0 -->
```

#### ConflictDialog.svelte

```svelte
<script lang="ts">
  import { getConflicts, resolveConflict } from '$lib/state/sync-context.svelte';
  import { t } from '$lib/i18n';

  let conflicts = $derived(getConflicts());

  async function chooseLocal(conflictId: number) {
    await resolveConflict(conflictId, 'local');
  }

  async function chooseRemote(conflictId: number) {
    await resolveConflict(conflictId, 'remote');
  }
</script>

<!-- Modal dialog showing local vs remote data side by side -->
```

### New State Context Modules

#### auth-context.svelte.ts

```typescript
// $lib/state/auth-context.svelte.ts

let isAuthenticated = $state(false);
let username = $state<string | null>(null);
let authToken = $state<string | null>(null);

export function getIsAuthenticated(): boolean { return isAuthenticated; }
export function getUsername(): string | null { return username; }
export function getAuthToken(): string | null { return authToken; }

export function setAuthState(token: string, user: string): void {
  authToken = token;
  username = user;
  isAuthenticated = true;
}

export function clearAuthState(): void {
  authToken = null;
  username = null;
  isAuthenticated = false;
}

export async function initAuthContext(): Promise<void> {
  // Read auth_token and auth_username from APP_SETTINGS
  // If both exist, set authenticated state
}
```

#### network-context.svelte.ts

```typescript
// $lib/state/network-context.svelte.ts
import { Network } from '@capacitor/network';

let isOnline = $state(true);

export function getIsOnline(): boolean { return isOnline; }

export async function initNetworkContext(): Promise<void> {
  const status = await Network.getStatus();
  isOnline = status.connected;

  Network.addListener('networkStatusChange', (status) => {
    isOnline = status.connected;
  });
}
```

#### sync-context.svelte.ts

```typescript
// $lib/state/sync-context.svelte.ts

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncConflict {
  id: number;
  tableName: string;
  recordId: number;
  courseId: number;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
}

let syncStatus = $state<SyncStatus>('idle');
let conflicts = $state<SyncConflict[]>([]);
let pendingCount = $state(0);

export function getSyncStatus(): SyncStatus { return syncStatus; }
export function getConflicts(): SyncConflict[] { return conflicts; }
export function getConflictCount(): number { return conflicts.length; }
export function getPendingCount(): number { return pendingCount; }

export function setSyncStatus(status: SyncStatus): void { syncStatus = status; }
export function setPendingCount(count: number): void { pendingCount = count; }

export function addConflict(conflict: SyncConflict): void {
  conflicts = [...conflicts, conflict];
}

export async function resolveConflict(conflictId: number, choice: 'local' | 'remote'): Promise<void> {
  // Delegate to sync-service to resolve
  // Remove from conflicts array
  conflicts = conflicts.filter(c => c.id !== conflictId);
}

export function clearConflicts(): void {
  conflicts = [];
}
```

### New Services

#### api-client.ts

```typescript
// $lib/services/api-client.ts
import { getAuthToken } from '$lib/state/auth-context.svelte';
import { clearAuthState } from '$lib/state/auth-context.svelte';

const BASE_URL = ''; // Configured via APP_SETTINGS or environment

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { headers });

  if (response.status === 401) {
    clearAuthState();
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, error: await response.text() };
  }

  return { ok: true, status: response.status, data: await response.json() };
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    clearAuthState();
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  if (response.status === 409) {
    return { ok: false, status: 409, data: await response.json() };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, error: await response.text() };
  }

  return { ok: true, status: response.status, data: await response.json() };
}

export function getBaseUrl(): string { return BASE_URL; }
export function setBaseUrl(url: string): void { /* update BASE_URL */ }
```

#### auth-service.ts

```typescript
// $lib/services/auth-service.ts
import { apiPost } from './api-client';
import { setAuthState, clearAuthState } from '$lib/state/auth-context.svelte';
import { setSetting, getSetting, deleteSetting } from '$lib/data/repositories/settings-repository';
import { clearSyncQueue } from '$lib/data/repositories/sync-queue-repository';

export async function login(username: string, password: string): Promise<void> {
  const response = await apiPost<{ token: string }>('/api/auth/login', { username, password });

  if (!response.ok) {
    throw new Error(response.error || 'Login failed');
  }

  const token = response.data!.token;
  await setSetting('auth_token', token);
  await setSetting('auth_username', username);
  setAuthState(token, username);
}

export async function logout(): Promise<void> {
  await deleteSetting('auth_token');
  await deleteSetting('auth_username');
  await clearSyncQueue();
  clearAuthState();
}

export async function restoreAuth(): Promise<void> {
  const token = await getSetting('auth_token');
  const username = await getSetting('auth_username');
  if (token && username) {
    setAuthState(token, username);
  }
}
```

#### sync-service.ts

```typescript
// $lib/services/sync-service.ts
import { apiPost, apiGet } from './api-client';
import { getIsAuthenticated, getAuthToken } from '$lib/state/auth-context.svelte';
import { getIsOnline } from '$lib/state/network-context.svelte';
import { setSyncStatus, setPendingCount, addConflict } from '$lib/state/sync-context.svelte';
import {
  getQueueEntries, deleteQueueEntry, getQueueCount,
  markQueueEntryConflicted, getQueueEntryById
} from '$lib/data/repositories/sync-queue-repository';

export async function processSyncQueue(): Promise<void> {
  if (!getIsAuthenticated() || !getIsOnline()) return;

  setSyncStatus('syncing');
  const entries = await getQueueEntries();

  for (const entry of entries) {
    const result = await sendSyncEntry(entry);

    if (result === 'success') {
      await deleteQueueEntry(entry.id);
    } else if (result === 'conflict') {
      // Conflict handled — entry marked, user will resolve
    } else if (result === 'network-error') {
      setSyncStatus('offline');
      return; // Stop processing, retry on reconnect
    } else if (result === 'server-error') {
      const retried = await retryWithBackoff(entry);
      if (!retried) {
        setSyncStatus('error');
        return;
      }
    }
  }

  const remaining = await getQueueCount();
  setPendingCount(remaining);
  setSyncStatus(remaining > 0 ? 'error' : 'idle');
}

async function sendSyncEntry(entry: SyncQueueEntry): Promise<'success' | 'conflict' | 'network-error' | 'server-error'> {
  try {
    const response = await apiPost('/api/sync/push', {
      table_name: entry.table_name,
      record_id: entry.record_id,
      operation: entry.operation,
      course_id: entry.course_id,
      payload: entry.payload ? JSON.parse(entry.payload) : null,
    });

    if (response.ok) return 'success';
    if (response.status === 409) {
      addConflict({
        id: entry.id,
        tableName: entry.table_name,
        recordId: entry.record_id,
        courseId: entry.course_id,
        localData: entry.payload ? JSON.parse(entry.payload) : {},
        remoteData: response.data as Record<string, unknown>,
      });
      return 'conflict';
    }
    if (response.status >= 500) return 'server-error';
    return 'server-error';
  } catch {
    return 'network-error';
  }
}

async function retryWithBackoff(entry: SyncQueueEntry): Promise<boolean> {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (const delay of delays) {
    await new Promise(r => setTimeout(r, Math.min(delay, 30000)));
    const result = await sendSyncEntry(entry);
    if (result === 'success') {
      await deleteQueueEntry(entry.id);
      return true;
    }
    if (result === 'network-error') return false;
  }
  return false;
}

export async function resolveConflictOnServer(
  conflictId: number,
  choice: 'local' | 'remote'
): Promise<void> {
  if (choice === 'local') {
    // Re-send the local version with force flag
    const entry = await getQueueEntryById(conflictId);
    if (entry) {
      await apiPost('/api/sync/push', {
        table_name: entry.table_name,
        record_id: entry.record_id,
        operation: entry.operation,
        course_id: entry.course_id,
        payload: entry.payload ? JSON.parse(entry.payload) : null,
        force: true,
      });
      await deleteQueueEntry(entry.id);
    }
  } else {
    // Apply remote data locally
    const entry = await getQueueEntryById(conflictId);
    if (entry) {
      // Update local record with remote data via appropriate repository
      await deleteQueueEntry(entry.id);
    }
  }
}

export async function pullDataFromServer(courseId: number): Promise<void> {
  // GET /api/sync/pull?course_id=courseId
  // Insert/update all returned records into local database
}

export async function fetchResourceList(): Promise<void> {
  // GET /api/resources/translations → upsert TRANSLATION_RESOURCE
  // GET /api/resources/tafsirs → upsert TAFSIR_RESOURCE
}
```

### Updated resource-service.ts

```typescript
// Updates to $lib/services/resource-service.ts
// downloadTranslationResource and downloadTafsirResource now use api-client
// to fetch from the PHP backend instead of generic fetch

import { apiGet } from './api-client';

export async function downloadTranslationResource(resourceId: number): Promise<void> {
  const resource = await getTranslationResource(resourceId);
  if (!resource || resource.is_downloaded) return;

  const response = await apiGet<TranslationEntryPayload[]>(resource.download_url);
  if (!response.ok) throw new Error(response.error || 'Download failed');

  await insertTranslationEntries(response.data!.map(e => ({
    resource_id: resourceId,
    surah_number: e.surah_number,
    verse_number: e.verse_number,
    text_content: e.text_content,
  })));
  await markTranslationDownloaded(resourceId);
}
```

### New Data Access Layer

#### sync-queue-repository.ts

```typescript
// $lib/data/repositories/sync-queue-repository.ts
export interface SyncQueueEntry {
  id: number;
  table_name: string;
  record_id: number;
  operation: 'insert' | 'update' | 'delete';
  course_id: number;
  payload: string | null;
  created_at: string;
}

export async function insertQueueEntry(
  tableName: string,
  recordId: number,
  operation: 'insert' | 'update' | 'delete',
  courseId: number,
  payload?: Record<string, unknown>
): Promise<number> {
  // INSERT INTO SYNC_QUEUE (table_name, record_id, operation, course_id, payload, created_at)
  // VALUES (?, ?, ?, ?, ?, datetime('now'))
}

export async function getQueueEntries(): Promise<SyncQueueEntry[]> {
  // SELECT * FROM SYNC_QUEUE ORDER BY id ASC
}

export async function getQueueEntryById(id: number): Promise<SyncQueueEntry | null> {
  // SELECT * FROM SYNC_QUEUE WHERE id = ?
}

export async function getQueueCount(): Promise<number> {
  // SELECT COUNT(*) FROM SYNC_QUEUE
}

export async function getQueueEntriesByCourse(courseId: number): Promise<SyncQueueEntry[]> {
  // SELECT * FROM SYNC_QUEUE WHERE course_id = ? ORDER BY id ASC
}

export async function deleteQueueEntry(id: number): Promise<void> {
  // DELETE FROM SYNC_QUEUE WHERE id = ?
}

export async function clearSyncQueue(): Promise<void> {
  // DELETE FROM SYNC_QUEUE
}

export async function clearSyncQueueForCourse(courseId: number): Promise<void> {
  // DELETE FROM SYNC_QUEUE WHERE course_id = ?
}

export async function markQueueEntryConflicted(id: number): Promise<void> {
  // UPDATE SYNC_QUEUE SET operation = 'conflict' WHERE id = ?
  // (or add a status column — keeping simple with operation override)
}
```

#### Updated settings-repository.ts

```typescript
// Addition to $lib/data/repositories/settings-repository.ts
export async function deleteSetting(key: string): Promise<void> {
  // DELETE FROM APP_SETTINGS WHERE key = ?
}
```

### Sync Queue Integration Pattern

Existing repositories that mutate syncable data need a thin wrapper to enqueue changes. This is done via a helper:

```typescript
// $lib/data/sync-helpers.ts
import { getIsAuthenticated } from '$lib/state/auth-context.svelte';
import { insertQueueEntry } from '$lib/data/repositories/sync-queue-repository';

export async function enqueueIfAuthenticated(
  tableName: string,
  recordId: number,
  operation: 'insert' | 'update' | 'delete',
  courseId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  if (getIsAuthenticated()) {
    await insertQueueEntry(tableName, recordId, operation, courseId, payload);
  }
}
```

Existing repository functions (bookmark-repository, topic-repository, word-data-repository, etc.) call `enqueueIfAuthenticated` after each successful mutation. Example:

```typescript
// In bookmark-repository.ts — updated insertBookmark
export async function insertBookmark(courseId: number, surahNumber: number, verseNumber: number, label?: string, note?: string): Promise<number> {
  const id = /* INSERT INTO BOOKMARK ... */;
  await enqueueIfAuthenticated('BOOKMARK', id, 'insert', courseId, {
    surah_number: surahNumber, verse_number: verseNumber, label, note
  });
  return id;
}
```

## PHP Backend API Endpoints

The PHP backend exposes the following REST endpoints. The client consumes these; the server implementation is outside this spec's scope but the contract is defined here.

### POST /api/auth/login
- **Request**: `{ "username": string, "password": string }`
- **Response 200**: `{ "token": string, "username": string }`
- **Response 401**: `{ "error": "Invalid credentials" }`

### POST /api/auth/logout
- **Headers**: `Authorization: Bearer <token>`
- **Response 200**: `{ "ok": true }`

### POST /api/sync/push
- **Headers**: `Authorization: Bearer <token>`
- **Request**: `{ "table_name": string, "record_id": number, "operation": "insert"|"update"|"delete", "course_id": number, "payload": object|null, "force"?: boolean }`
- **Response 200**: `{ "ok": true, "sync_version": number }`
- **Response 409**: `{ "conflict": true, "remote_data": object, "remote_sync_version": number }`
- **Response 401**: `{ "error": "Unauthorized" }`

### GET /api/sync/pull?course_id={id}
- **Headers**: `Authorization: Bearer <token>`
- **Response 200**: `{ "tables": { "BOOKMARK": [...], "TOPIC": [...], ... } }`

### GET /api/resources/translations
- **Response 200**: `[{ "id": number, "name": string, "language": string, "translator": string, "download_url": string }]`

### GET /api/resources/tafsirs
- **Response 200**: `[{ "id": number, "name": string, "author": string, "download_url": string }]`

### GET /api/resources/translations/{id}/download
- **Response 200**: `[{ "surah_number": number, "verse_number": number, "text_content": string }]`

### GET /api/resources/tafsirs/{id}/download
- **Response 200**: `[{ "surah_number": number, "verse_number": number, "text_content": string }]`

## Data Models

### New Tables (Migration 004)

```
SYNC_QUEUE
├── id (PK, auto-increment)
├── table_name (text, not null)
├── record_id (integer, not null)
├── operation (text: insert, update, delete)
├── course_id (integer, not null)
├── payload (text, nullable — JSON)
└── created_at (text, not null)
```

### Migration SQL (004-auth-sync.sql)

```sql
CREATE TABLE IF NOT EXISTS SYNC_QUEUE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('insert', 'update', 'delete')),
  course_id INTEGER NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_course ON SYNC_QUEUE(course_id);

-- Update db_version
UPDATE APP_SETTINGS SET value = '4' WHERE key = 'db_version';
```

### Migration Runner Update

```typescript
// Updated $lib/data/migrations/index.ts
import initialSql from './001-initial.sql?raw';
import coursesSql from './002-courses.sql?raw';
import analysisSql from './003-analysis.sql?raw';
import authSyncSql from './004-auth-sync.sql?raw';

export const migrations = [
  { version: 1, sql: initialSql },
  { version: 2, sql: coursesSql },
  { version: 3, sql: analysisSql },
  { version: 4, sql: authSyncSql },
];
```

## Updated File Structure (Phase 4 additions)

```
client/src/lib/
├── components/
│   ├── auth/                              # NEW directory
│   │   ├── LoginPage.svelte               # NEW
│   │   ├── UserProfile.svelte             # NEW
│   │   └── LoginButton.svelte             # NEW
│   ├── shared/
│   │   ├── NetworkIndicator.svelte        # NEW
│   │   ├── SyncStatusIndicator.svelte     # NEW
│   │   └── ConflictDialog.svelte          # NEW
│   └── navigation/
│       └── NavigationBar.svelte           # Updated: adds UserProfile, NetworkIndicator
├── state/
│   ├── auth-context.svelte.ts             # NEW
│   ├── network-context.svelte.ts          # NEW
│   ├── sync-context.svelte.ts             # NEW
│   └── (existing contexts)
├── services/
│   ├── api-client.ts                      # NEW
│   ├── auth-service.ts                    # NEW
│   ├── sync-service.ts                    # NEW
│   ├── resource-service.ts                # Updated: uses api-client
│   └── (existing services)
├── data/
│   ├── migrations/
│   │   ├── 004-auth-sync.sql              # NEW
│   │   └── index.ts                       # Updated: add migration 004
│   ├── repositories/
│   │   ├── sync-queue-repository.ts       # NEW
│   │   ├── settings-repository.ts         # Updated: deleteSetting
│   │   ├── bookmark-repository.ts         # Updated: enqueue on mutations
│   │   ├── topic-repository.ts            # Updated: enqueue on mutations
│   │   ├── word-data-repository.ts        # Updated: enqueue on mutations
│   │   ├── translation-repository.ts      # Updated: enqueue on mutations
│   │   ├── tafsir-repository.ts           # Updated: enqueue on mutations
│   │   ├── siyaq-repository.ts            # Updated: enqueue on mutations
│   │   ├── nazm-kavi-repository.ts        # Updated: enqueue on mutations
│   │   ├── shabake-kavi-repository.ts     # Updated: enqueue on mutations
│   │   ├── eqameh-repository.ts           # Updated: enqueue on mutations
│   │   └── course-repository.ts           # Updated: enqueue on mutations
│   └── sync-helpers.ts                    # NEW
└── i18n/
    ├── fa.ts                              # Updated: Phase 4 keys
    └── en.ts                              # Updated: Phase 4 keys
```

### New i18n Keys

```typescript
// Additions to fa.ts and en.ts
{
  'auth.login': 'ورود' / 'Login',
  'auth.logout': 'خروج' / 'Logout',
  'auth.username': 'نام کاربری' / 'Username',
  'auth.password': 'رمز عبور' / 'Password',
  'auth.login_button': 'ورود' / 'Sign In',
  'auth.login_failed': 'ورود ناموفق بود' / 'Login failed',
  'auth.login_error_network': 'اتصال به سرور برقرار نشد' / 'Could not connect to server',
  'auth.logged_in_as': 'وارد شده به عنوان' / 'Logged in as',
  'network.online': 'آنلاین' / 'Online',
  'network.offline': 'آفلاین' / 'Offline',
  'sync.syncing': 'در حال همگام‌سازی...' / 'Syncing...',
  'sync.idle': 'همگام' / 'Synced',
  'sync.error': 'خطا در همگام‌سازی' / 'Sync error',
  'sync.pending': '{count} تغییر در انتظار' / '{count} pending changes',
  'conflict.title': 'تعارض داده' / 'Data Conflict',
  'conflict.local_version': 'نسخه محلی' / 'Local Version',
  'conflict.remote_version': 'نسخه سرور' / 'Remote Version',
  'conflict.choose_local': 'نگه داشتن نسخه محلی' / 'Keep Local',
  'conflict.choose_remote': 'نگه داشتن نسخه سرور' / 'Keep Remote',
  'conflict.pending': '{count} تعارض' / '{count} conflicts',
  'resource.downloading': 'در حال دانلود...' / 'Downloading...',
  'resource.download_failed': 'دانلود ناموفق بود' / 'Download failed',
  'resource.retry': 'تلاش مجدد' / 'Retry',
}
```

## Correctness Properties

### Property 1: Auth Token Round-Trip
FOR ALL valid login responses, storing the Auth_Token in APP_SETTINGS and then restoring it via initAuthContext SHALL produce the same authenticated state (isAuthenticated = true, same username, same token).

### Property 2: Sync Queue Ordering
FOR ALL sequences of mutations to User_Data, the SYNC_QUEUE entries SHALL be ordered by their auto-increment id, preserving the chronological order of operations.

### Property 3: Sync Queue Completeness
FOR ALL mutations to syncable tables while authenticated, the SYNC_QUEUE SHALL contain exactly one entry per mutation with the correct table_name, record_id, operation, and course_id.

### Property 4: Logout Clears Auth State
WHEN logout is called, the APP_SETTINGS SHALL contain no auth_token key, no auth_username key, and the SYNC_QUEUE SHALL be empty.

### Property 5: Offline Feature Parity
FOR ALL app features (reading, bookmarks, topics, analysis tabs), the feature SHALL function identically whether the User is authenticated or not, and whether the device is online or offline.

### Property 6: Conflict Preservation
WHEN the PHP_Backend returns a 409 Conflict, the Sync_Service SHALL preserve both the local data (from the queue entry payload) and the remote data (from the 409 response body) without discarding either version.

### Property 7: Network Status Consistency
FOR ALL network status changes detected by @capacitor/network, the network-context isOnline state SHALL match the actual connectivity status reported by the plugin.

### Property 8: Queue Cleanup on Logout
FOR ALL logout operations, the SYNC_QUEUE table SHALL contain zero entries after logout completes, regardless of how many entries existed before.
