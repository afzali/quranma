# Design Document — Quran Ma Phase 1: Application Foundation and Skeleton

## Overview

Phase 1 establishes the foundational skeleton of the Quran Ma desktop application. It delivers a working SvelteKit SPA wrapped in Capacitor Electron for Windows, with a three-panel layout, bilingual UI (Persian/English), a local SQLite database with core Quran data tables, a Table of Contents for navigating Surahs, and Quran text rendering with proper Arabic typography.

### Key Design Decisions

1. **Capacitor + @capacitor-community/electron for Windows**: Capacitor does not natively support Windows. We use the community Electron plugin to wrap the SvelteKit static build in Electron for desktop deployment.

2. **@capacitor-community/sqlite for local storage**: Provides a unified SQLite API. On Electron it uses better-sqlite3. On web (dev mode) it uses sql.js backed by IndexedDB via jeep-sqlite.

3. **shadcn-rtl as UI foundation**: 54 RTL-ready components, RtlProvider, cnRtl utility, and rtl-context — all copied into `$lib/components/ui-rtl/`. We extend rather than fork.

4. **paneforge for resizable panels**: Already a dependency in shadcn-rtl. Provides PaneGroup, Pane, PaneResizer with collapsible support and autoSaveId for persistence.

5. **Svelte 5 runes for state**: No external state library. All reactive state uses `$state`, `$derived`, `$effect`. Shared state lives in context modules following shadcn-rtl's pattern.

6. **Four-layer architecture**: UI → State → Service → DAL. Keeps concerns separated and testable.

7. **adapter-static with SPA fallback**: Since the app runs inside Capacitor, we produce a fully static build. No SSR, no server routes.

## Architecture

### High-Level Architecture (Phase 1)

```
┌─────────────────────────────────────────────┐
│              SvelteKit SPA                   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  UI Layer (Svelte Components)         │   │
│  │  shadcn-rtl + paneforge + custom      │   │
│  └──────────┬───────────────────────────┘   │
│             │                                │
│  ┌──────────▼───────────────────────────┐   │
│  │  State Layer (Svelte 5 Rune Contexts) │   │
│  │  selection, i18n, ui                  │   │
│  └──────────┬───────────────────────────┘   │
│             │                                │
│  ┌──────────▼───────────────────────────┐   │
│  │  Service Layer (Business Logic)       │   │
│  │  quran-service                        │   │
│  └──────────┬───────────────────────────┘   │
│             │                                │
│  ┌──────────▼───────────────────────────┐   │
│  │  Data Access Layer (Repositories)     │   │
│  │  quran-repo, settings-repo            │   │
│  └──────────┬───────────────────────────┘   │
│             │                                │
│  ┌──────────▼───────────────────────────┐   │
│  │  @capacitor-community/sqlite          │   │
│  └──────────────────────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Capacitor Electron  │
│  (Windows Desktop)   │
└─────────────────────┘
```

### Layered Architecture

1. **UI Layer**: Svelte components using shadcn-rtl and paneforge. Organized by panel: `navigation/`, `quran/`, `shared/`.

2. **State Layer**: Svelte 5 rune-based context modules. Phase 1 has three: `selection-context`, `i18n-context`, `ui-context`.

3. **Service Layer**: Business logic functions. Phase 1 has `quran-service` (fetch Surah list, fetch verses).

4. **Data Access Layer**: Repository modules abstracting SQLite operations. Phase 1 has `quran-repository` and `settings-repository`.

## Components and Interfaces

### Component Hierarchy (Phase 1)

```
+layout.svelte (RtlProvider, I18nProvider, DatabaseInit)
└── +page.svelte (AppShell)
    ├── PaneGroup (horizontal, autoSaveId="quran-ma-layout")
    │   ├── Pane (Analysis — left, collapsible)
    │   │   └── AnalysisPlaceholder
    │   ├── PaneResizer
    │   ├── Pane (Quran Display — center)
    │   │   └── QuranDisplay
    │   │       ├── SurahHeader
    │   │       ├── Bismillah
    │   │       └── VerseList
    │   │           └── VerseItem (×N)
    │   ├── PaneResizer
    │   └── Pane (Navigation — right, collapsible)
    │       └── NavigationBar
    │           ├── LanguageSwitcher
    │           └── TableOfContents
    │               └── SurahListItem (×114)
    └── MobileOverlay (shown < 768px)
```

### Key Component Interfaces

#### Root Layout (+layout.svelte)

Wraps the entire app with providers:

```svelte
<script>
  import { RtlProvider } from '$lib/components/ui-rtl/rtl-provider';
  import { initDatabase } from '$lib/data/database';
  import { initI18n } from '$lib/i18n';
  import { restoreSelection } from '$lib/state/selection-context.svelte';
  import { onMount } from 'svelte';

  let ready = $state(false);

  onMount(async () => {
    await initDatabase();
    await initI18n();
    await restoreSelection();
    ready = true;
  });
</script>

<RtlProvider>
  {#if ready}
    <slot />
  {:else}
    <LoadingScreen />
  {/if}
</RtlProvider>
```

#### AppShell (+page.svelte)

Three-panel layout using paneforge:

```svelte
<PaneGroup direction="horizontal" autoSaveId="quran-ma-layout">
  <!-- Analysis Panel (Left) — placeholder in Phase 1 -->
  <Pane defaultSize={25} minSize={15} collapsible collapsedSize={0}>
    <AnalysisPlaceholder />
  </Pane>
  <PaneResizer />

  <!-- Quran Display (Center) -->
  <Pane defaultSize={50} minSize={30}>
    <QuranDisplay />
  </Pane>
  <PaneResizer />

  <!-- Navigation Bar (Right) -->
  <Pane defaultSize={25} minSize={15} collapsible collapsedSize={0}>
    <NavigationBar />
  </Pane>
</PaneGroup>
```

**RTL behavior**: The PaneGroup container has CSS `direction: rtl` when Persian is active. This visually reverses the panel order so Navigation appears on the right and Analysis on the left. The DOM order stays the same.

#### Responsive behavior (< 768px)

On small screens, the side panes are hidden from the PaneGroup. Instead, NavigationBar and AnalysisPlaceholder render inside a MobileOverlay component toggled by buttons in a top toolbar. The Quran_Display always remains visible.

### State Context Modules

#### selection-context.svelte.ts

```typescript
// $lib/state/selection-context.svelte.ts
export type Selection = {
  surahNumber: number;
  verseNumber: number | null; // null = Surah-level selection
};

let selection = $state<Selection>({ surahNumber: 1, verseNumber: null });

export function getSelection(): Selection {
  return selection;
}

export function selectSurah(surahNumber: number): void {
  selection = { surahNumber, verseNumber: null };
  persistSelection();
}

export function selectVerse(surahNumber: number, verseNumber: number): void {
  selection = { surahNumber, verseNumber };
  persistSelection();
}

export function isVerseLevelSelection(): boolean {
  return selection.verseNumber !== null;
}

export async function restoreSelection(): Promise<void> {
  // Load from APP_SETTINGS via settings-repository
}

async function persistSelection(): void {
  // Save to APP_SETTINGS via settings-repository
}
```

#### i18n-context.svelte.ts

```typescript
// $lib/state/i18n-context.svelte.ts
export type Locale = 'fa' | 'en';
export type Direction = 'rtl' | 'ltr';

let locale = $state<Locale>('fa');
let direction = $derived<Direction>(locale === 'fa' ? 'rtl' : 'ltr');

export function getLocale(): Locale { return locale; }
export function getDirection(): Direction { return direction; }

export async function setLocale(newLocale: Locale): Promise<void> {
  locale = newLocale;
  // Persist to APP_SETTINGS
}

export async function initI18n(): Promise<void> {
  // Load locale from APP_SETTINGS, default to 'fa'
}
```

#### ui-context.svelte.ts

```typescript
// $lib/state/ui-context.svelte.ts
let navBarVisible = $state(true);
let analysisPanelVisible = $state(true);
let isMobile = $state(false);

export function getNavBarVisible(): boolean { return navBarVisible; }
export function getAnalysisPanelVisible(): boolean { return analysisPanelVisible; }
export function getIsMobile(): boolean { return isMobile; }
export function toggleNavBar(): void { navBarVisible = !navBarVisible; }
export function toggleAnalysisPanel(): void { analysisPanelVisible = !analysisPanelVisible; }
export function setIsMobile(value: boolean): void { isMobile = value; }
```

### I18n System

Simple key-based translation with two locale files:

```typescript
// $lib/i18n/index.ts
import fa from './fa';
import en from './en';
import { getLocale } from '$lib/state/i18n-context.svelte';

const translations = { fa, en };

export function t(key: string): string {
  const locale = getLocale();
  return translations[locale][key] ?? key;
}
```

```typescript
// $lib/i18n/fa.ts
export default {
  'app.title': 'قرآن ما',
  'nav.toc': 'فهرست سوره‌ها',
  'nav.language': 'زبان',
  'quran.bismillah': 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
  'quran.verses': 'آیه',
  'analysis.placeholder': 'ابزارهای تحلیل در نسخه بعدی اضافه خواهند شد',
  'surah.meccan': 'مکی',
  'surah.medinan': 'مدنی',
  // ... more keys
} as Record<string, string>;
```

```typescript
// $lib/i18n/en.ts
export default {
  'app.title': 'Quran Ma',
  'nav.toc': 'Table of Contents',
  'nav.language': 'Language',
  'quran.bismillah': 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
  'quran.verses': 'verses',
  'analysis.placeholder': 'Analysis tools coming in a future update',
  'surah.meccan': 'Meccan',
  'surah.medinan': 'Medinan',
  // ... more keys
} as Record<string, string>;
```

### Data Access Layer

#### Database Initialization

```typescript
// $lib/data/database.ts
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

let db: SQLiteDBConnection | null = null;

export async function initDatabase(): Promise<void> {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  db = await sqlite.createConnection('quranma', false, 'no-encryption', 1, false);
  await db.open();
  await runMigrations(db);
}

export function getDb(): SQLiteDBConnection {
  if (!db) throw new Error('Database not initialized');
  return db;
}
```

#### Quran Repository

```typescript
// $lib/data/repositories/quran-repository.ts
export interface SurahInfo {
  number: number;
  nameArabic: string;
  nameTransliteration: string;
  verseCount: number;
  revelationType: 'meccan' | 'medinan';
}

export interface Verse {
  id: number;
  surahNumber: number;
  verseNumber: number;
  textArabic: string;
  textSimple: string;
}

export async function getSurahList(): Promise<SurahInfo[]> { /* SELECT from SURAH */ }
export async function getSurahVerses(surahNumber: number): Promise<Verse[]> { /* SELECT from VERSE */ }
export async function getVerse(surahNumber: number, verseNumber: number): Promise<Verse | null> { /* SELECT from VERSE */ }
```

#### Settings Repository

```typescript
// $lib/data/repositories/settings-repository.ts
export async function getSetting(key: string): Promise<string | null> { /* SELECT from APP_SETTINGS */ }
export async function setSetting(key: string, value: string): Promise<void> { /* INSERT OR REPLACE into APP_SETTINGS */ }
export async function getLastSelection(): Promise<{ surahNumber: number; verseNumber: number | null }> { /* Read from APP_SETTINGS */ }
export async function saveLastSelection(surahNumber: number, verseNumber: number | null): Promise<void> { /* Write to APP_SETTINGS */ }
```

## Data Models

### Entity Relationship Diagram (Phase 1)

```
SURAH (114 rows)
├── number (PK, integer)
├── name_arabic (text)
├── name_transliteration (text)
├── verse_count (integer)
└── revelation_type (text: 'meccan' | 'medinan')

VERSE (~6236 rows)
├── id (PK, integer)
├── surah_number (FK → SURAH.number)
├── verse_number (integer)
├── text_arabic (text)
└── text_simple (text)

WORD
├── id (PK, integer)
├── surah_number (FK → SURAH.number)
├── verse_number (integer)
├── position (integer)
├── text_arabic (text)
├── root (text)
├── meaning_default (text)
└── derivatives (text)

APP_SETTINGS
├── key (PK, text)
└── value (text)
```

### Initial Migration SQL (001-initial.sql)

```sql
CREATE TABLE IF NOT EXISTS SURAH (
  number INTEGER PRIMARY KEY,
  name_arabic TEXT NOT NULL,
  name_transliteration TEXT NOT NULL,
  verse_count INTEGER NOT NULL,
  revelation_type TEXT NOT NULL CHECK(revelation_type IN ('meccan', 'medinan'))
);

CREATE TABLE IF NOT EXISTS VERSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  text_arabic TEXT NOT NULL,
  text_simple TEXT NOT NULL,
  FOREIGN KEY (surah_number) REFERENCES SURAH(number),
  UNIQUE(surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS WORD (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  position INTEGER NOT NULL,
  text_arabic TEXT NOT NULL,
  root TEXT,
  meaning_default TEXT,
  derivatives TEXT,
  FOREIGN KEY (surah_number) REFERENCES SURAH(number),
  UNIQUE(surah_number, verse_number, position)
);

CREATE TABLE IF NOT EXISTS APP_SETTINGS (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Default settings
INSERT OR IGNORE INTO APP_SETTINGS (key, value) VALUES ('db_version', '1');
INSERT OR IGNORE INTO APP_SETTINGS (key, value) VALUES ('locale', 'fa');

CREATE INDEX IF NOT EXISTS idx_verse_surah ON VERSE(surah_number);
CREATE INDEX IF NOT EXISTS idx_word_verse ON WORD(surah_number, verse_number);
```

### Database Migration Strategy

Migrations are versioned SQL scripts executed sequentially on startup:

```typescript
// $lib/data/migrations/index.ts
import initialSql from './001-initial.sql?raw';

export const migrations = [
  { version: 1, sql: initialSql },
];

export async function runMigrations(db: SQLiteDBConnection): Promise<void> {
  // Check current version from APP_SETTINGS
  // Apply any migrations with version > current
  // Update db_version after each successful migration
}
```

### Quran Data Seeding

The SURAH table is seeded with metadata for all 114 Surahs as part of the initial migration or a separate seed script. The VERSE and WORD tables will be populated from a bundled JSON or SQL data file containing the full Quran text. This data file is included in the application's static assets and imported during the first database initialization.

## Project File Structure (Phase 1)

```
client/
├── capacitor.config.ts
├── svelte.config.js
├── vite.config.ts
├── package.json
├── src/
│   ├── app.html
│   ├── app.css                      # Tailwind v4, Vazirmatn font, Quran font
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui-rtl/              # Copied from shadcn-rtl
│   │   │   ├── navigation/
│   │   │   │   ├── NavigationBar.svelte
│   │   │   │   ├── TableOfContents.svelte
│   │   │   │   ├── SurahListItem.svelte
│   │   │   │   └── LanguageSwitcher.svelte
│   │   │   ├── quran/
│   │   │   │   ├── QuranDisplay.svelte
│   │   │   │   ├── SurahHeader.svelte
│   │   │   │   ├── Bismillah.svelte
│   │   │   │   ├── VerseList.svelte
│   │   │   │   └── VerseItem.svelte
│   │   │   └── shared/
│   │   │       ├── AppShell.svelte
│   │   │       ├── AnalysisPlaceholder.svelte
│   │   │       ├── MobileOverlay.svelte
│   │   │       └── LoadingScreen.svelte
│   │   ├── state/
│   │   │   ├── selection-context.svelte.ts
│   │   │   ├── i18n-context.svelte.ts
│   │   │   └── ui-context.svelte.ts
│   │   ├── data/
│   │   │   ├── database.ts
│   │   │   ├── migrations/
│   │   │   │   ├── 001-initial.sql
│   │   │   │   └── index.ts
│   │   │   ├── seed/
│   │   │   │   └── quran-data.json   # Bundled Quran text data
│   │   │   └── repositories/
│   │   │       ├── quran-repository.ts
│   │   │       └── settings-repository.ts
│   │   ├── services/
│   │   │   └── quran-service.ts
│   │   ├── i18n/
│   │   │   ├── index.ts
│   │   │   ├── fa.ts
│   │   │   └── en.ts
│   │   └── utils/
│   │       ├── rtl-utils.ts          # From shadcn-rtl (cnRtl)
│   │       ├── rtl-context.svelte.ts  # From shadcn-rtl
│   │       └── quran-utils.ts        # Verse key formatting, Arabic numeral conversion
│   └── routes/
│       ├── +layout.svelte
│       └── +page.svelte
├── electron/                         # Capacitor Electron project
└── static/
    ├── fonts/
    │   └── Vazirmatn/                # Vazirmatn font files
    └── assets/
        └── sql-wasm.wasm            # Required for web/dev SQLite
```

## Correctness Properties

### Property 1: Selection Persistence Round-Trip
FOR ALL valid Selection values (surahNumber 1-114, verseNumber null or 1-N), saving a Selection to APP_SETTINGS and then restoring it SHALL produce an equivalent Selection object.

### Property 2: Surah List Completeness
THE getSurahList() function SHALL always return exactly 114 SurahInfo objects, each with a unique number from 1 to 114.

### Property 3: Verse Count Consistency
FOR ALL Surahs, the number of Verse records returned by getSurahVerses(surahNumber) SHALL equal the verse_count field of the corresponding SURAH record.

### Property 4: Bismillah Exclusion for Surah 9
FOR ALL Surahs, the Bismillah component SHALL render if and only if the Surah number is not 9.

### Property 5: RTL/LTR Direction Derivation
FOR ALL locale values, the direction SHALL be 'rtl' when locale is 'fa' and 'ltr' when locale is 'en'. Setting locale and reading direction SHALL always be consistent.

### Property 6: Translation Key Coverage
FOR ALL keys present in the Persian translation file (fa.ts), the English translation file (en.ts) SHALL also contain that key, and vice versa.
