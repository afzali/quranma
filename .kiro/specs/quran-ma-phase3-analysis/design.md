# Design Document — Quran Ma Phase 3: Analysis Panel

## Overview

Phase 3 replaces the Analysis Panel placeholder from Phase 1 with seven functional tabs, each providing a distinct analytical lens for Quran study. A centralized Highlight System integrates with the Quran_Display to visually mark verses. All user-generated data is scoped to the Active_Course from Phase 2.

### Key Design Decisions

1. **AnalysisTabs component replaces AnalysisPlaceholder**: The existing left pane renders a new AnalysisTabs component instead of the placeholder. No changes to the paneforge layout structure.

2. **highlight-context.svelte.ts as centralized highlight state**: A single reactive context module manages all highlight sources (siyaq colors, nazm-kavi markers, selection). VerseItem reads from this context to apply styles. This avoids prop-drilling and keeps highlight logic decoupled from individual tabs.

3. **resource-service for download management**: Translation and Tafsir resources share a common download pattern. A resource-service handles fetching, storing entries, and updating the is_downloaded flag.

4. **One repository per entity group**: Each major entity (word-data, translation, tafsir, siyaq, nazm-kavi, shabake-kavi, eqameh) gets its own repository module. Resource tables (TRANSLATION_RESOURCE, TAFSIR_RESOURCE) are managed by a shared resource-repository.

5. **Migration 003 as single SQL file**: All 14 new tables are created in one migration, consistent with the Phase 2 pattern.

6. **Course cascade extended**: The existing deleteCourseAndData function in course-repository is extended to delete all Phase 3 tables. Similarly, duplicateCourse copies all Phase 3 records.

## Architecture

### Extended Architecture (Phase 3 additions in bold)

```
┌─────────────────────────────────────────────────┐
│              SvelteKit SPA                       │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  UI Layer                                 │   │
│  │  Phase 1: NavigationBar, QuranDisplay     │   │
│  │  Phase 2: CourseSwitcher, Search, etc.    │   │
│  │  Phase 3: AnalysisTabs, WordAnalysisTab   │   │
│  │           TranslationTab, TafsirTab       │   │
│  │           SiyaqTab, NazmKaviTab           │   │
│  │           ShabakeKaviTab, EqamehTab       │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                    │
│  ┌──────────▼───────────────────────────────┐   │
│  │  State Layer                              │   │
│  │  Phase 1: selection, i18n, ui             │   │
│  │  Phase 2: course-context                  │   │
│  │  Phase 3: highlight-context               │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                    │
│  ┌──────────▼───────────────────────────────┐   │
│  │  Service Layer                            │   │
│  │  Phase 1: quran-service                   │   │
│  │  Phase 2: search-service                  │   │
│  │  Phase 3: highlight-service,              │   │
│  │           resource-service                │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                    │
│  ┌──────────▼───────────────────────────────┐   │
│  │  Data Access Layer                        │   │
│  │  Phase 1: quran-repo, settings-repo       │   │
│  │  Phase 2: course-repo, bookmark-repo,     │   │
│  │           topic-repo                      │   │
│  │  Phase 3: word-data-repo, translation-repo│   │
│  │           tafsir-repo, siyaq-repo,        │   │
│  │           nazm-kavi-repo, shabake-kavi-repo│  │
│  │           eqameh-repo, resource-repo      │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                    │
│  ┌──────────▼───────────────────────────────┐   │
│  │  @capacitor-community/sqlite              │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Components and Interfaces

### Updated Component Hierarchy (Phase 3 additions marked with *)

```
+layout.svelte
└── +page.svelte (AppShell)
    ├── PaneGroup
    │   ├── Pane (Analysis — left, collapsible)
    │   │   └── *AnalysisTabs (replaces AnalysisPlaceholder)
    │   │       ├── *WordAnalysisTab
    │   │       │   └── *WordCard (×N per verse)
    │   │       ├── *TranslationTab
    │   │       │   ├── *TranslationResourceList
    │   │       │   ├── *TranslationEntry (×N)
    │   │       │   └── *PersonalTranslationEditor
    │   │       ├── *TafsirTab
    │   │       │   ├── *TafsirResourceList
    │   │       │   ├── *TafsirEntry (×N)
    │   │       │   └── *PersonalTafsirEditor
    │   │       ├── *SiyaqTab
    │   │       │   ├── *SiyaqGroupCard (×N)
    │   │       │   ├── *SiyaqGroupEditor
    │   │       │   └── *SiyaqToggle
    │   │       ├── *NazmKaviTab
    │   │       │   ├── *NazmKaviItemCard (×N)
    │   │       │   ├── *NazmKaviItemEditor
    │   │       │   └── *NazmKaviTypeFilter
    │   │       ├── *ShabakeKaviTab
    │   │       │   ├── *ConnectionCard (×N)
    │   │       │   └── *ConnectionEditor
    │   │       └── *EqamehTab
    │   │           ├── *EqamehEntryCard (×N)
    │   │           └── *EqamehEntryEditor
    │   ├── PaneResizer
    │   ├── Pane (Quran Display — center)
    │   │   └── QuranDisplay
    │   │       └── VerseItem — *updated: reads highlight-context
    │   ├── PaneResizer
    │   └── Pane (Navigation — right)
    │       └── NavigationBar (Phase 2)
    └── MobileOverlay
```

### Key Component Interfaces

#### AnalysisTabs.svelte

```svelte
<script lang="ts">
  import { t } from '$lib/i18n';
  import { getSetting, setSetting } from '$lib/data/repositories/settings-repository';
  import WordAnalysisTab from './WordAnalysisTab.svelte';
  import TranslationTab from './TranslationTab.svelte';
  import TafsirTab from './TafsirTab.svelte';
  import SiyaqTab from './SiyaqTab.svelte';
  import NazmKaviTab from './NazmKaviTab.svelte';
  import ShabakeKaviTab from './ShabakeKaviTab.svelte';
  import EqamehTab from './EqamehTab.svelte';

  let activeTab = $state('word-analysis');

  const tabs = [
    { id: 'word-analysis', labelKey: 'analysis.tab.word' },
    { id: 'translation', labelKey: 'analysis.tab.translation' },
    { id: 'tafsir', labelKey: 'analysis.tab.tafsir' },
    { id: 'siyaq', labelKey: 'analysis.tab.siyaq' },
    { id: 'nazm-kavi', labelKey: 'analysis.tab.nazm_kavi' },
    { id: 'shabake-kavi', labelKey: 'analysis.tab.shabake_kavi' },
    { id: 'eqameh', labelKey: 'analysis.tab.eqameh' },
  ];
</script>
```

#### WordAnalysisTab.svelte

```svelte
<script lang="ts">
  import { getSelection, isVerseLevelSelection } from '$lib/state/selection-context.svelte';
  import { getActiveCourseId } from '$lib/state/course-context.svelte';
  import { getWordsForVerse } from '$lib/data/repositories/quran-repository';
  import { getUserWordData, upsertUserWordData } from '$lib/data/repositories/word-data-repository';

  let selection = $derived(getSelection());
  let courseId = $derived(getActiveCourseId());
  let isVerseLevel = $derived(isVerseLevelSelection());
  let words = $state([]);
  let userWordData = $state([]);

  $effect(() => {
    if (isVerseLevel && selection.verseNumber && courseId) {
      loadWords(selection.surahNumber, selection.verseNumber, courseId);
    }
  });
</script>
```

### New State Context Module

#### highlight-context.svelte.ts

```typescript
// $lib/state/highlight-context.svelte.ts

export type HighlightType = 'siyaq' | 'nazm-kavi' | 'selection';

export interface VerseHighlight {
  siyaqColor: string | null;       // CSS color from Siyaq_Group
  nazmKaviActive: boolean;         // true if any active Nazm_Kavi_Item references this verse
  nazmKaviType: string | null;     // 'repetition' | 'contrast' | 'axis' | 'pattern'
}

// Map key: "surahNumber:verseNumber"
let highlights = $state<Map<string, VerseHighlight>>(new Map());
let showAllSiyaq = $state(false);
let activeNazmKaviId = $state<number | null>(null);

export function getHighlights(): Map<string, VerseHighlight> { return highlights; }
export function getShowAllSiyaq(): boolean { return showAllSiyaq; }
export function getActiveNazmKaviId(): number | null { return activeNazmKaviId; }

export function getVerseHighlight(surahNumber: number, verseNumber: number): VerseHighlight | null {
  return highlights.get(`${surahNumber}:${verseNumber}`) ?? null;
}

export function setShowAllSiyaq(value: boolean): void {
  showAllSiyaq = value;
}

export function setActiveNazmKaviId(id: number | null): void {
  activeNazmKaviId = id;
}

export function setSiyaqHighlights(groups: { color: string; verses: { surahNumber: number; verseNumber: number }[] }[]): void {
  // Clear existing siyaq highlights, then apply new ones
}

export function setNazmKaviHighlights(verses: { surahNumber: number; verseNumber: number; type: string }[]): void {
  // Clear existing nazm-kavi highlights, then apply new ones
}

export function clearAllHighlights(): void {
  highlights = new Map();
  showAllSiyaq = false;
  activeNazmKaviId = null;
}
```

### New Services

#### highlight-service.ts

```typescript
// $lib/services/highlight-service.ts
import { setSiyaqHighlights, setNazmKaviHighlights, clearAllHighlights } from '$lib/state/highlight-context.svelte';
import { getSiyaqGroupsForSurah } from '$lib/data/repositories/siyaq-repository';
import { getNazmKaviItemWithVerses } from '$lib/data/repositories/nazm-kavi-repository';

export async function loadSiyaqHighlights(courseId: number, surahNumber: number): Promise<void> {
  const groups = await getSiyaqGroupsForSurah(courseId, surahNumber);
  setSiyaqHighlights(groups.map(g => ({
    color: g.color,
    verses: g.verses
  })));
}

export async function loadNazmKaviHighlights(nazmKaviId: number): Promise<void> {
  const item = await getNazmKaviItemWithVerses(nazmKaviId);
  if (item) {
    setNazmKaviHighlights(item.verses.map(v => ({
      surahNumber: v.surahNumber,
      verseNumber: v.verseNumber,
      type: item.type
    })));
  }
}

export function clearHighlightsForCourseSwitch(): void {
  clearAllHighlights();
}
```

#### resource-service.ts

```typescript
// $lib/services/resource-service.ts
import { getTranslationResource, markTranslationDownloaded, insertTranslationEntries } from '$lib/data/repositories/resource-repository';
import { getTafsirResource, markTafsirDownloaded, insertTafsirEntries } from '$lib/data/repositories/resource-repository';

export async function downloadTranslationResource(resourceId: number): Promise<void> {
  const resource = await getTranslationResource(resourceId);
  if (!resource || resource.is_downloaded) return;
  // Fetch data from resource.download_url
  // Parse response into entries
  // Insert entries into TRANSLATION_ENTRY
  // Mark resource as downloaded
}

export async function downloadTafsirResource(resourceId: number): Promise<void> {
  const resource = await getTafsirResource(resourceId);
  if (!resource || resource.is_downloaded) return;
  // Fetch data from resource.download_url
  // Parse response into entries
  // Insert entries into TAFSIR_ENTRY
  // Mark resource as downloaded
}
```

### New Data Access Layer

#### word-data-repository.ts

```typescript
// $lib/data/repositories/word-data-repository.ts
export interface UserWordDataRow {
  id: number;
  course_id: number;
  surah_number: number;
  verse_number: number;
  word_position: number;
  personal_meaning: string | null;
  selected_meaning: string | null;
  note: string | null;
}

export async function getUserWordData(courseId: number, surahNumber: number, verseNumber: number): Promise<UserWordDataRow[]> {
  // SELECT FROM USER_WORD_DATA WHERE course_id AND surah_number AND verse_number
}

export async function upsertUserWordData(courseId: number, surahNumber: number, verseNumber: number, wordPosition: number, data: { personalMeaning?: string; selectedMeaning?: string; note?: string }): Promise<void> {
  // INSERT OR REPLACE INTO USER_WORD_DATA
}
```

#### translation-repository.ts

```typescript
// $lib/data/repositories/translation-repository.ts
export interface UserTranslationRow {
  id: number;
  course_id: number;
  surah_number: number;
  verse_number: number;
  personal_translation: string | null;
  note: string | null;
}

export async function getUserTranslation(courseId: number, surahNumber: number, verseNumber: number): Promise<UserTranslationRow | null> {
  // SELECT FROM USER_TRANSLATION
}

export async function upsertUserTranslation(courseId: number, surahNumber: number, verseNumber: number, data: { personalTranslation?: string; note?: string }): Promise<void> {
  // INSERT OR REPLACE INTO USER_TRANSLATION
}
```

#### tafsir-repository.ts

```typescript
// $lib/data/repositories/tafsir-repository.ts
export interface UserTafsirRow {
  id: number;
  course_id: number;
  surah_number: number;
  verse_number: number;
  personal_tafsir: string | null;
  note: string | null;
}

export async function getUserTafsir(courseId: number, surahNumber: number, verseNumber: number): Promise<UserTafsirRow | null> {
  // SELECT FROM USER_TAFSIR
}

export async function upsertUserTafsir(courseId: number, surahNumber: number, verseNumber: number, data: { personalTafsir?: string; note?: string }): Promise<void> {
  // INSERT OR REPLACE INTO USER_TAFSIR
}
```

#### resource-repository.ts

```typescript
// $lib/data/repositories/resource-repository.ts
export interface TranslationResourceRow {
  id: number; name: string; language: string; translator: string;
  is_downloaded: number; download_url: string;
}
export interface TafsirResourceRow {
  id: number; name: string; author: string;
  is_downloaded: number; download_url: string;
}
export interface TranslationEntryRow {
  id: number; resource_id: number; surah_number: number;
  verse_number: number; text_content: string;
}
export interface TafsirEntryRow {
  id: number; resource_id: number; surah_number: number;
  verse_number: number; text_content: string;
}

export async function getAllTranslationResources(): Promise<TranslationResourceRow[]> { /* SELECT */ }
export async function getTranslationResource(id: number): Promise<TranslationResourceRow | null> { /* SELECT */ }
export async function getTranslationEntriesForVerse(resourceId: number, surahNumber: number, verseNumber: number): Promise<TranslationEntryRow[]> { /* SELECT */ }
export async function getDownloadedTranslationEntriesForVerse(surahNumber: number, verseNumber: number): Promise<(TranslationEntryRow & { translator: string; language: string })[]> { /* JOIN */ }
export async function insertTranslationEntries(entries: Omit<TranslationEntryRow, 'id'>[]): Promise<void> { /* batch INSERT */ }
export async function markTranslationDownloaded(resourceId: number): Promise<void> { /* UPDATE is_downloaded = 1 */ }

export async function getAllTafsirResources(): Promise<TafsirResourceRow[]> { /* SELECT */ }
export async function getTafsirResource(id: number): Promise<TafsirResourceRow | null> { /* SELECT */ }
export async function getDownloadedTafsirEntriesForVerse(surahNumber: number, verseNumber: number): Promise<(TafsirEntryRow & { author: string })[]> { /* JOIN */ }
export async function insertTafsirEntries(entries: Omit<TafsirEntryRow, 'id'>[]): Promise<void> { /* batch INSERT */ }
export async function markTafsirDownloaded(resourceId: number): Promise<void> { /* UPDATE is_downloaded = 1 */ }
```

#### siyaq-repository.ts

```typescript
// $lib/data/repositories/siyaq-repository.ts
export interface SiyaqGroupRow {
  id: number; course_id: number; surah_number: number;
  title: string; color: string; description: string | null;
  created_at: string;
}
export interface SiyaqGroupWithVerses extends SiyaqGroupRow {
  verses: { surahNumber: number; verseNumber: number }[];
}

export async function getSiyaqGroupsForSurah(courseId: number, surahNumber: number): Promise<SiyaqGroupWithVerses[]> { /* JOIN */ }
export async function insertSiyaqGroup(courseId: number, surahNumber: number, title: string, color: string, description?: string): Promise<number> { /* INSERT, return id */ }
export async function updateSiyaqGroup(id: number, data: { title?: string; color?: string; description?: string }): Promise<void> { /* UPDATE */ }
export async function deleteSiyaqGroup(id: number): Promise<void> { /* DELETE SIYAQ_VERSE then SIYAQ_GROUP */ }
export async function setSiyaqVerses(siyaqGroupId: number, verses: { surahNumber: number; verseNumber: number }[]): Promise<void> { /* DELETE old, INSERT new */ }
```

#### nazm-kavi-repository.ts

```typescript
// $lib/data/repositories/nazm-kavi-repository.ts
export interface NazmKaviItemRow {
  id: number; course_id: number; type: string;
  title: string; description: string | null; created_at: string;
}
export interface NazmKaviItemWithVerses extends NazmKaviItemRow {
  verses: { surahNumber: number; verseNumber: number }[];
}

export async function getNazmKaviItemsByCourse(courseId: number): Promise<NazmKaviItemRow[]> { /* SELECT */ }
export async function getNazmKaviItemWithVerses(id: number): Promise<NazmKaviItemWithVerses | null> { /* JOIN */ }
export async function getNazmKaviItemsByType(courseId: number, type: string): Promise<NazmKaviItemRow[]> { /* SELECT WHERE type */ }
export async function insertNazmKaviItem(courseId: number, type: string, title: string, description?: string): Promise<number> { /* INSERT */ }
export async function updateNazmKaviItem(id: number, data: { type?: string; title?: string; description?: string }): Promise<void> { /* UPDATE */ }
export async function deleteNazmKaviItem(id: number): Promise<void> { /* DELETE NAZM_KAVI_VERSE then NAZM_KAVI_ITEM */ }
export async function setNazmKaviVerses(nazmKaviId: number, verses: { surahNumber: number; verseNumber: number }[]): Promise<void> { /* DELETE old, INSERT new */ }
```

#### shabake-kavi-repository.ts

```typescript
// $lib/data/repositories/shabake-kavi-repository.ts
export interface ShabakeKaviConnectionRow {
  id: number; course_id: number; source_surah: number; source_verse: number;
  target_type: string; target_reference: string;
  title: string; description: string | null; created_at: string;
}

export async function getConnectionsForVerse(courseId: number, surahNumber: number, verseNumber: number): Promise<ShabakeKaviConnectionRow[]> { /* SELECT */ }
export async function getConnectionsByType(courseId: number, surahNumber: number, verseNumber: number, targetType: string): Promise<ShabakeKaviConnectionRow[]> { /* SELECT WHERE target_type */ }
export async function insertConnection(courseId: number, data: Omit<ShabakeKaviConnectionRow, 'id' | 'course_id' | 'created_at'>): Promise<number> { /* INSERT */ }
export async function updateConnection(id: number, data: Partial<Pick<ShabakeKaviConnectionRow, 'target_type' | 'target_reference' | 'title' | 'description'>>): Promise<void> { /* UPDATE */ }
export async function deleteConnection(id: number): Promise<void> { /* DELETE */ }
```

#### eqameh-repository.ts

```typescript
// $lib/data/repositories/eqameh-repository.ts
export interface EqamehEntryRow {
  id: number; course_id: number; surah_number: number;
  verse_number: number | null; type: string;
  text_content: string; created_at: string;
}

export async function getEqamehEntriesForSurah(courseId: number, surahNumber: number): Promise<EqamehEntryRow[]> { /* SELECT */ }
export async function getEqamehEntriesByType(courseId: number, surahNumber: number, type: string): Promise<EqamehEntryRow[]> { /* SELECT WHERE type */ }
export async function insertEqamehEntry(courseId: number, surahNumber: number, verseNumber: number | null, type: string, textContent: string): Promise<number> { /* INSERT */ }
export async function updateEqamehEntry(id: number, data: { type?: string; textContent?: string; verseNumber?: number | null }): Promise<void> { /* UPDATE */ }
export async function deleteEqamehEntry(id: number): Promise<void> { /* DELETE */ }
```

## Data Models

### New Tables (Migration 003)

```
USER_WORD_DATA
├── id (PK, auto-increment)
├── course_id (FK → COURSE.id)
├── surah_number (integer)
├── verse_number (integer)
├── word_position (integer)
├── personal_meaning (text, nullable)
├── selected_meaning (text, nullable)
├── note (text, nullable)
├── sync_version (integer, default 0)
└── UNIQUE(course_id, surah_number, verse_number, word_position)

USER_TRANSLATION
├── id (PK, auto-increment)
├── course_id (FK → COURSE.id)
├── surah_number (integer)
├── verse_number (integer)
├── personal_translation (text, nullable)
├── note (text, nullable)
├── sync_version (integer, default 0)
└── UNIQUE(course_id, surah_number, verse_number)

USER_TAFSIR
├── id (PK, auto-increment)
├── course_id (FK → COURSE.id)
├── surah_number (integer)
├── verse_number (integer)
├── personal_tafsir (text, nullable)
├── note (text, nullable)
├── sync_version (integer, default 0)
└── UNIQUE(course_id, surah_number, verse_number)

TRANSLATION_RESOURCE
├── id (PK, auto-increment)
├── name (text)
├── language (text)
├── translator (text)
├── is_downloaded (integer, default 0)
└── download_url (text)

TRANSLATION_ENTRY
├── id (PK, auto-increment)
├── resource_id (FK → TRANSLATION_RESOURCE.id)
├── surah_number (integer)
├── verse_number (integer)
├── text_content (text)
└── UNIQUE(resource_id, surah_number, verse_number)

TAFSIR_RESOURCE
├── id (PK, auto-increment)
├── name (text)
├── author (text)
├── is_downloaded (integer, default 0)
└── download_url (text)

TAFSIR_ENTRY
├── id (PK, auto-increment)
├── resource_id (FK → TAFSIR_RESOURCE.id)
├── surah_number (integer)
├── verse_number (integer)
├── text_content (text)
└── UNIQUE(resource_id, surah_number, verse_number)

SIYAQ_GROUP
├── id (PK, auto-increment)
├── course_id (FK → COURSE.id)
├── surah_number (integer)
├── title (text)
├── color (text)
├── description (text, nullable)
├── created_at (text)
└── sync_version (integer, default 0)

SIYAQ_VERSE
├── id (PK, auto-increment)
├── siyaq_group_id (FK → SIYAQ_GROUP.id)
├── surah_number (integer)
├── verse_number (integer)
└── UNIQUE(siyaq_group_id, surah_number, verse_number)

NAZM_KAVI_ITEM
├── id (PK, auto-increment)
├── course_id (FK → COURSE.id)
├── type (text: repetition|contrast|axis|pattern)
├── title (text)
├── description (text, nullable)
├── created_at (text)
└── sync_version (integer, default 0)

NAZM_KAVI_VERSE
├── id (PK, auto-increment)
├── nazm_kavi_id (FK → NAZM_KAVI_ITEM.id)
├── surah_number (integer)
└── verse_number (integer)

SHABAKE_KAVI_CONNECTION
├── id (PK, auto-increment)
├── course_id (FK → COURSE.id)
├── source_surah (integer)
├── source_verse (integer)
├── target_type (text: verse|hadith|story|concept|external|video)
├── target_reference (text)
├── title (text)
├── description (text, nullable)
├── created_at (text)
└── sync_version (integer, default 0)

EQAMEH_ENTRY
├── id (PK, auto-increment)
├── course_id (FK → COURSE.id)
├── surah_number (integer)
├── verse_number (integer, nullable)
├── type (text: principle|duty|message|decision|action)
├── text_content (text)
├── created_at (text)
└── sync_version (integer, default 0)
```


### Migration SQL (003-analysis.sql)

```sql
CREATE TABLE IF NOT EXISTS USER_WORD_DATA (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  word_position INTEGER NOT NULL,
  personal_meaning TEXT,
  selected_meaning TEXT,
  note TEXT,
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id),
  UNIQUE(course_id, surah_number, verse_number, word_position)
);

CREATE TABLE IF NOT EXISTS USER_TRANSLATION (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  personal_translation TEXT,
  note TEXT,
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id),
  UNIQUE(course_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS USER_TAFSIR (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  personal_tafsir TEXT,
  note TEXT,
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id),
  UNIQUE(course_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS TRANSLATION_RESOURCE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  translator TEXT NOT NULL,
  is_downloaded INTEGER NOT NULL DEFAULT 0,
  download_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS TRANSLATION_ENTRY (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  FOREIGN KEY (resource_id) REFERENCES TRANSLATION_RESOURCE(id),
  UNIQUE(resource_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS TAFSIR_RESOURCE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  is_downloaded INTEGER NOT NULL DEFAULT 0,
  download_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS TAFSIR_ENTRY (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  FOREIGN KEY (resource_id) REFERENCES TAFSIR_RESOURCE(id),
  UNIQUE(resource_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS SIYAQ_GROUP (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE TABLE IF NOT EXISTS SIYAQ_VERSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siyaq_group_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  FOREIGN KEY (siyaq_group_id) REFERENCES SIYAQ_GROUP(id),
  UNIQUE(siyaq_group_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS NAZM_KAVI_ITEM (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('repetition', 'contrast', 'axis', 'pattern')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE TABLE IF NOT EXISTS NAZM_KAVI_VERSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nazm_kavi_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  FOREIGN KEY (nazm_kavi_id) REFERENCES NAZM_KAVI_ITEM(id)
);

CREATE TABLE IF NOT EXISTS SHABAKE_KAVI_CONNECTION (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  source_surah INTEGER NOT NULL,
  source_verse INTEGER NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('verse', 'hadith', 'story', 'concept', 'external', 'video')),
  target_reference TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE TABLE IF NOT EXISTS EQAMEH_ENTRY (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER,
  type TEXT NOT NULL CHECK(type IN ('principle', 'duty', 'message', 'decision', 'action')),
  text_content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_word_data_course_verse ON USER_WORD_DATA(course_id, surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_user_translation_course_verse ON USER_TRANSLATION(course_id, surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_user_tafsir_course_verse ON USER_TAFSIR(course_id, surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_translation_entry_resource_verse ON TRANSLATION_ENTRY(resource_id, surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_tafsir_entry_resource_verse ON TAFSIR_ENTRY(resource_id, surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_siyaq_group_course_surah ON SIYAQ_GROUP(course_id, surah_number);
CREATE INDEX IF NOT EXISTS idx_siyaq_verse_group ON SIYAQ_VERSE(siyaq_group_id);
CREATE INDEX IF NOT EXISTS idx_nazm_kavi_item_course ON NAZM_KAVI_ITEM(course_id);
CREATE INDEX IF NOT EXISTS idx_nazm_kavi_verse_item ON NAZM_KAVI_VERSE(nazm_kavi_id);
CREATE INDEX IF NOT EXISTS idx_shabake_kavi_course_source ON SHABAKE_KAVI_CONNECTION(course_id, source_surah, source_verse);
CREATE INDEX IF NOT EXISTS idx_eqameh_course_surah ON EQAMEH_ENTRY(course_id, surah_number);

-- Update db_version
UPDATE APP_SETTINGS SET value = '3' WHERE key = 'db_version';
```

### Migration Runner Update

```typescript
// Updated $lib/data/migrations/index.ts
import initialSql from './001-initial.sql?raw';
import coursesSql from './002-courses.sql?raw';
import analysisSql from './003-analysis.sql?raw';

export const migrations = [
  { version: 1, sql: initialSql },
  { version: 2, sql: coursesSql },
  { version: 3, sql: analysisSql },
];
```

### Updated Course Repository (Cascade Extension)

The deleteCourseAndData function in course-repository.ts is extended:

```typescript
export async function deleteCourseAndData(id: number): Promise<void> {
  // Phase 2 deletes
  // DELETE FROM TOPIC_VERSE WHERE topic_id IN (SELECT id FROM TOPIC WHERE course_id = ?)
  // DELETE FROM TOPIC WHERE course_id = ?
  // DELETE FROM BOOKMARK WHERE course_id = ?
  // DELETE FROM COURSE_SETTINGS WHERE course_id = ?

  // Phase 3 deletes
  // DELETE FROM USER_WORD_DATA WHERE course_id = ?
  // DELETE FROM USER_TRANSLATION WHERE course_id = ?
  // DELETE FROM USER_TAFSIR WHERE course_id = ?
  // DELETE FROM SIYAQ_VERSE WHERE siyaq_group_id IN (SELECT id FROM SIYAQ_GROUP WHERE course_id = ?)
  // DELETE FROM SIYAQ_GROUP WHERE course_id = ?
  // DELETE FROM NAZM_KAVI_VERSE WHERE nazm_kavi_id IN (SELECT id FROM NAZM_KAVI_ITEM WHERE course_id = ?)
  // DELETE FROM NAZM_KAVI_ITEM WHERE course_id = ?
  // DELETE FROM SHABAKE_KAVI_CONNECTION WHERE course_id = ?
  // DELETE FROM EQAMEH_ENTRY WHERE course_id = ?

  // DELETE FROM COURSE WHERE id = ?
}
```

## Updated File Structure (Phase 3 additions)

```
client/src/lib/
├── components/
│   ├── analysis/                          # NEW directory
│   │   ├── AnalysisTabs.svelte            # NEW — tab container
│   │   ├── WordAnalysisTab.svelte         # NEW
│   │   ├── WordCard.svelte                # NEW
│   │   ├── TranslationTab.svelte          # NEW
│   │   ├── TranslationResourceList.svelte # NEW
│   │   ├── TranslationEntry.svelte        # NEW
│   │   ├── PersonalTranslationEditor.svelte # NEW
│   │   ├── TafsirTab.svelte              # NEW
│   │   ├── TafsirResourceList.svelte     # NEW
│   │   ├── TafsirEntry.svelte            # NEW
│   │   ├── PersonalTafsirEditor.svelte   # NEW
│   │   ├── SiyaqTab.svelte               # NEW
│   │   ├── SiyaqGroupCard.svelte         # NEW
│   │   ├── SiyaqGroupEditor.svelte       # NEW
│   │   ├── SiyaqToggle.svelte            # NEW
│   │   ├── NazmKaviTab.svelte            # NEW
│   │   ├── NazmKaviItemCard.svelte       # NEW
│   │   ├── NazmKaviItemEditor.svelte     # NEW
│   │   ├── NazmKaviTypeFilter.svelte     # NEW
│   │   ├── ShabakeKaviTab.svelte         # NEW
│   │   ├── ConnectionCard.svelte         # NEW
│   │   ├── ConnectionEditor.svelte       # NEW
│   │   ├── EqamehTab.svelte              # NEW
│   │   ├── EqamehEntryCard.svelte        # NEW
│   │   └── EqamehEntryEditor.svelte      # NEW
│   ├── quran/
│   │   └── VerseItem.svelte              # Updated: reads highlight-context
│   └── shared/
│       └── AnalysisPlaceholder.svelte    # Removed (replaced by AnalysisTabs)
├── state/
│   ├── highlight-context.svelte.ts       # NEW
│   └── (existing contexts)
├── services/
│   ├── highlight-service.ts              # NEW
│   ├── resource-service.ts               # NEW
│   └── (existing services)
├── data/
│   ├── migrations/
│   │   ├── 003-analysis.sql              # NEW
│   │   └── index.ts                      # Updated: add migration 003
│   └── repositories/
│       ├── word-data-repository.ts       # NEW
│       ├── translation-repository.ts     # NEW
│       ├── tafsir-repository.ts          # NEW
│       ├── resource-repository.ts        # NEW
│       ├── siyaq-repository.ts           # NEW
│       ├── nazm-kavi-repository.ts       # NEW
│       ├── shabake-kavi-repository.ts    # NEW
│       ├── eqameh-repository.ts          # NEW
│       └── course-repository.ts          # Updated: cascade extension
└── i18n/
    ├── fa.ts                             # Updated: Phase 3 keys
    └── en.ts                             # Updated: Phase 3 keys
```

### New i18n Keys

```typescript
// Additions to fa.ts and en.ts
{
  'analysis.tab.word': 'واژه' / 'Word Analysis',
  'analysis.tab.translation': 'ترجمه' / 'Translation',
  'analysis.tab.tafsir': 'تفسیر' / 'Tafsir',
  'analysis.tab.siyaq': 'سیاق' / 'Siyaq',
  'analysis.tab.nazm_kavi': 'نظم‌کاوی' / 'Nazm-Kavi',
  'analysis.tab.shabake_kavi': 'شبکه‌کاوی' / 'Shabake-Kavi',
  'analysis.tab.eqameh': 'اقامه' / 'Eqameh',
  'analysis.select_verse': 'لطفاً یک آیه انتخاب کنید' / 'Please select a verse',
  'word.root': 'ریشه' / 'Root',
  'word.meaning': 'معنی' / 'Meaning',
  'word.derivatives': 'مشتقات' / 'Derivatives',
  'word.personal_meaning': 'معنی شخصی' / 'Personal Meaning',
  'word.selected_meaning': 'معنی انتخابی' / 'Selected Meaning',
  'word.note': 'یادداشت' / 'Note',
  'translation.download': 'دانلود' / 'Download',
  'translation.downloaded': 'دانلود شده' / 'Downloaded',
  'translation.personal': 'ترجمه شخصی' / 'Personal Translation',
  'translation.set_default': 'تنظیم پیش‌فرض' / 'Set as Default',
  'tafsir.download': 'دانلود' / 'Download',
  'tafsir.downloaded': 'دانلود شده' / 'Downloaded',
  'tafsir.personal': 'تفسیر شخصی' / 'Personal Tafsir',
  'siyaq.create': 'ایجاد گروه سیاق' / 'Create Siyaq Group',
  'siyaq.edit': 'ویرایش' / 'Edit',
  'siyaq.delete': 'حذف' / 'Delete',
  'siyaq.title': 'عنوان' / 'Title',
  'siyaq.color': 'رنگ' / 'Color',
  'siyaq.description': 'توضیحات' / 'Description',
  'siyaq.show_all': 'نمایش همه سیاق‌ها' / 'Show All Siyaq',
  'nazm_kavi.create': 'ایجاد آیتم نظم‌کاوی' / 'Create Nazm-Kavi Item',
  'nazm_kavi.type.repetition': 'تکرار' / 'Repetition',
  'nazm_kavi.type.contrast': 'تقابل' / 'Contrast',
  'nazm_kavi.type.axis': 'محور' / 'Axis',
  'nazm_kavi.type.pattern': 'الگو' / 'Pattern',
  'nazm_kavi.activate': 'فعال‌سازی' / 'Activate',
  'nazm_kavi.filter': 'فیلتر بر اساس نوع' / 'Filter by Type',
  'shabake_kavi.create': 'ایجاد اتصال' / 'Create Connection',
  'shabake_kavi.type.verse': 'آیه' / 'Verse',
  'shabake_kavi.type.hadith': 'حدیث' / 'Hadith',
  'shabake_kavi.type.story': 'داستان' / 'Story',
  'shabake_kavi.type.concept': 'مفهوم' / 'Concept',
  'shabake_kavi.type.external': 'منبع خارجی' / 'External Source',
  'shabake_kavi.type.video': 'ویدیو/سخنرانی' / 'Video/Lecture',
  'shabake_kavi.navigate': 'رفتن به آیه' / 'Go to Verse',
  'eqameh.create': 'ایجاد اقامه' / 'Create Eqameh Entry',
  'eqameh.type.principle': 'اصل' / 'Principle',
  'eqameh.type.duty': 'وظیفه' / 'Duty',
  'eqameh.type.message': 'پیام' / 'Message',
  'eqameh.type.decision': 'تصمیم' / 'Decision',
  'eqameh.type.action': 'عمل' / 'Action',
  'eqameh.verse_level': 'سطح آیه' / 'Verse Level',
  'eqameh.surah_level': 'سطح سوره' / 'Surah Level',
}
```

## Correctness Properties

### Property 1: Course Isolation for Phase 3 Data
FOR ALL courses C1 and C2 where C1.id ≠ C2.id, user word data, personal translations, personal tafsirs, siyaq groups, nazm-kavi items, shabake-kavi connections, and eqameh entries created in C1 SHALL NOT appear in queries scoped to C2.

### Property 2: User Word Data Uniqueness
FOR ALL upsert operations on USER_WORD_DATA, the combination (course_id, surah_number, verse_number, word_position) SHALL be unique. Upserting with the same key SHALL update the existing record rather than creating a duplicate.

### Property 3: Siyaq Group Cascade Delete
FOR ALL siyaq group deletions, deleting a SIYAQ_GROUP SHALL result in zero SIYAQ_VERSE records referencing that siyaq_group_id.

### Property 4: Nazm-Kavi Item Cascade Delete
FOR ALL nazm-kavi item deletions, deleting a NAZM_KAVI_ITEM SHALL result in zero NAZM_KAVI_VERSE records referencing that nazm_kavi_id.

### Property 5: Course Cascade Delete for Phase 3
FOR ALL course deletions, deleting a course SHALL result in zero USER_WORD_DATA, USER_TRANSLATION, USER_TAFSIR, SIYAQ_GROUP, SIYAQ_VERSE, NAZM_KAVI_ITEM, NAZM_KAVI_VERSE, SHABAKE_KAVI_CONNECTION, and EQAMEH_ENTRY records referencing that course_id.

### Property 6: Highlight State Consistency
FOR ALL highlight operations, the highlight map SHALL contain a siyaq color for a verse if and only if showAllSiyaq is true and the verse belongs to a SIYAQ_GROUP in the current Surah. The highlight map SHALL contain a nazm-kavi marker for a verse if and only if an active NAZM_KAVI_ITEM references that verse.

### Property 7: Translation Entry Uniqueness
FOR ALL translation entry inserts, the combination (resource_id, surah_number, verse_number) SHALL be unique. Attempting to insert a duplicate SHALL fail with a constraint violation.

### Property 8: Personal Translation Round-Trip
FOR ALL valid personal translation values, upserting a USER_TRANSLATION and then reading it back for the same (course_id, surah_number, verse_number) SHALL produce an equivalent record.
