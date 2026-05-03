# Design Document — Quran Ma Phase 2: Course System and Navigation

## Overview

Phase 2 extends the Phase 1 foundation with a Course system that provides isolated workspaces for Quran study. It adds Search, Bookmarks, Topics, and course-scoped navigation. The architecture follows the same four-layer pattern (UI → State → Service → DAL) established in Phase 1.

### Key Design Decisions

1. **Course as isolation boundary**: All user data (bookmarks, topics, settings) is scoped to a course via course_id foreign keys. This keeps workspaces independent and simplifies future sync.

2. **Navigation Bar tabs**: The Navigation_Bar evolves from a single Table of Contents into a tabbed panel with four sections (TOC, Search, Bookmarks, Topics). The Course_Switcher sits above the tabs.

3. **Course context module**: A new `course-context.svelte.ts` manages the active course. Selection context is updated to read/write per-course settings instead of global APP_SETTINGS.

4. **SQL LIKE for search**: Full-text search (FTS5) is deferred. Phase 2 uses SQL LIKE on text_arabic and text_simple columns with debouncing. This is sufficient for the current dataset size (~6236 verses).

5. **Database migration 002**: A single migration adds all five new tables. The migration runner from Phase 1 handles versioning automatically.

## Architecture

### Extended Architecture (Phase 2 additions in bold)

```
┌─────────────────────────────────────────────┐
│              SvelteKit SPA                   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  UI Layer                             │   │
│  │  Phase 1: NavigationBar, QuranDisplay │   │
│  │  Phase 2: CourseSwitcher, SearchPanel │   │
│  │           BookmarksPanel, TopicsPanel  │   │
│  │           NavigationTabs              │   │
│  └──────────┬───────────────────────────┘   │
│             │                                │
│  ┌──────────▼───────────────────────────┐   │
│  │  State Layer                          │   │
│  │  Phase 1: selection, i18n, ui         │   │
│  │  Phase 2: course-context              │   │
│  └──────────┬───────────────────────────┘   │
│             │                                │
│  ┌──────────▼───────────────────────────┐   │
│  │  Service Layer                        │   │
│  │  Phase 1: quran-service               │   │
│  │  Phase 2: search-service              │   │
│  └──────────┬───────────────────────────┘   │
│             │                                │
│  ┌──────────▼───────────────────────────┐   │
│  │  Data Access Layer                    │   │
│  │  Phase 1: quran-repo, settings-repo   │   │
│  │  Phase 2: course-repo, bookmark-repo  │   │
│  │           topic-repo                  │   │
│  └──────────┬───────────────────────────┘   │
│             │                                │
│  ┌──────────▼───────────────────────────┐   │
│  │  @capacitor-community/sqlite          │   │
│  └──────────────────────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

## Components and Interfaces

### Updated Component Hierarchy (Phase 2 additions marked with *)

```
+layout.svelte (RtlProvider, I18nProvider, DatabaseInit, *CourseInit)
└── +page.svelte (AppShell)
    ├── PaneGroup
    │   ├── Pane (Analysis — left, collapsible)
    │   │   └── AnalysisPlaceholder
    │   ├── PaneResizer
    │   ├── Pane (Quran Display — center)
    │   │   └── QuranDisplay
    │   │       ├── SurahHeader
    │   │       ├── Bismillah
    │   │       └── VerseList
    │   │           └── VerseItem (×N) — *now shows bookmark icon
    │   ├── PaneResizer
    │   └── Pane (Navigation — right, collapsible)
    │       └── NavigationBar
    │           ├── *CourseSwitcher
    │           │   └── *CourseDropdown
    │           ├── *NavigationTabs
    │           │   ├── Tab: TableOfContents (from Phase 1)
    │           │   ├── Tab: *SearchPanel
    │           │   │   ├── *SearchInput
    │           │   │   └── *SearchResultList
    │           │   │       └── *SearchResultItem (×N)
    │           │   ├── Tab: *BookmarksPanel
    │           │   │   └── *BookmarkGroup (×N, per Surah)
    │           │   │       └── *BookmarkItem (×N)
    │           │   └── Tab: *TopicsPanel
    │           │       └── *TopicItem (×N, expandable)
    │           │           └── *TopicVerseItem (×N)
    │           └── LanguageSwitcher
    └── MobileOverlay
```

### New Component Interfaces

#### CourseSwitcher.svelte

```svelte
<script lang="ts">
  import { getActiveCourse, getAllCourses, switchCourse, createCourse, renameCourse, deleteCourse, duplicateCourse } from '$lib/state/course-context.svelte';
  import { t } from '$lib/i18n';

  let courses = $derived(getAllCourses());
  let activeCourse = $derived(getActiveCourse());
  let dropdownOpen = $state(false);
</script>

<!-- Displays active course name + avatar, dropdown for switching/managing -->
```

#### SearchPanel.svelte

```svelte
<script lang="ts">
  import { searchVerses } from '$lib/services/search-service';
  import { selectVerse } from '$lib/state/selection-context.svelte';
  import { t } from '$lib/i18n';

  let query = $state('');
  let results = $state<SearchResult[]>([]);
  let totalCount = $state(0);
  let debounceTimer: ReturnType<typeof setTimeout>;

  $effect(() => {
    clearTimeout(debounceTimer);
    if (query.trim().length > 0) {
      debounceTimer = setTimeout(async () => {
        const searchResults = await searchVerses(query);
        results = searchResults.items;
        totalCount = searchResults.total;
      }, 300);
    } else {
      results = [];
      totalCount = 0;
    }
  });

  function navigateToResult(surahNumber: number, verseNumber: number) {
    selectVerse(surahNumber, verseNumber);
  }
</script>
```

#### BookmarksPanel.svelte

```svelte
<script lang="ts">
  import { getActiveCourseId } from '$lib/state/course-context.svelte';
  import { getBookmarksGroupedBySurah } from '$lib/data/repositories/bookmark-repository';
  import { selectVerse } from '$lib/state/selection-context.svelte';

  let courseId = $derived(getActiveCourseId());
  let bookmarkGroups = $state<BookmarkGroup[]>([]);

  $effect(() => {
    if (courseId) {
      loadBookmarks(courseId);
    }
  });

  async function loadBookmarks(cid: number) {
    bookmarkGroups = await getBookmarksGroupedBySurah(cid);
  }
</script>
```

#### TopicsPanel.svelte

```svelte
<script lang="ts">
  import { getActiveCourseId } from '$lib/state/course-context.svelte';
  import { getTopicsWithVerses, createTopic, renameTopic, deleteTopic } from '$lib/data/repositories/topic-repository';
  import { selectVerse } from '$lib/state/selection-context.svelte';

  let courseId = $derived(getActiveCourseId());
  let topics = $state<TopicWithVerses[]>([]);

  $effect(() => {
    if (courseId) {
      loadTopics(courseId);
    }
  });

  async function loadTopics(cid: number) {
    topics = await getTopicsWithVerses(cid);
  }
</script>
```

### New State Context Module

#### course-context.svelte.ts

```typescript
// $lib/state/course-context.svelte.ts
export interface Course {
  id: number;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

let activeCourse = $state<Course | null>(null);
let allCourses = $state<Course[]>([]);

export function getActiveCourse(): Course | null { return activeCourse; }
export function getActiveCourseId(): number | null { return activeCourse?.id ?? null; }
export function getAllCourses(): Course[] { return allCourses; }

export async function initCourseContext(): Promise<void> {
  // Load all courses from course-repository
  // If no courses exist, create Default_Course
  // Restore active course from APP_SETTINGS('active_course_id')
  // If stored course no longer exists, fall back to first course
}

export async function switchCourse(courseId: number): Promise<void> {
  // Save current selection to previous course's COURSE_SETTINGS
  // Set new active course
  // Restore selection from new course's COURSE_SETTINGS
  // Persist active_course_id to APP_SETTINGS
}

export async function createCourse(name: string): Promise<Course> {
  // Insert new course via course-repository
  // Create COURSE_SETTINGS record
  // Refresh allCourses
  // Switch to new course
}

export async function renameCourse(courseId: number, newName: string): Promise<void> {
  // Update via course-repository
  // Refresh allCourses
}

export async function deleteCourse(courseId: number): Promise<boolean> {
  // Check if this is the last course — if so, return false
  // Delete course and all associated data via course-repository
  // If deleted course was active, switch to first remaining course
  // Refresh allCourses
}

export async function duplicateCourse(courseId: number): Promise<Course> {
  // Duplicate via course-repository (copies bookmarks, topics, settings)
  // Refresh allCourses
  // Switch to new course
}

export async function setCourseAvatar(courseId: number, avatarUrl: string): Promise<void> {
  // Update via course-repository
  // Refresh allCourses
}
```

### Updated Selection Context

The selection-context.svelte.ts from Phase 1 is updated to persist per-course:

```typescript
// Changes to $lib/state/selection-context.svelte.ts

// persistSelection() now writes to COURSE_SETTINGS for the active course
// instead of APP_SETTINGS
async function persistSelection(): Promise<void> {
  const courseId = getActiveCourseId();
  if (courseId) {
    await saveCourseSelection(courseId, selection.surahNumber, selection.verseNumber);
  }
}

// restoreSelection() now reads from COURSE_SETTINGS for the active course
export async function restoreSelection(): Promise<void> {
  const courseId = getActiveCourseId();
  if (courseId) {
    const saved = await getCourseSelection(courseId);
    if (saved) {
      selection = { surahNumber: saved.lastSurah, verseNumber: saved.lastVerse };
    } else {
      selection = { surahNumber: 1, verseNumber: null };
    }
  }
}
```

### New Service

#### search-service.ts

```typescript
// $lib/services/search-service.ts
import { searchVersesInDb } from '$lib/data/repositories/quran-repository';

export interface SearchResult {
  surahNumber: number;
  surahNameArabic: string;
  verseNumber: number;
  textSnippet: string;
  matchStart: number;
  matchEnd: number;
}

export interface SearchResponse {
  items: SearchResult[];
  total: number;
}

export async function searchVerses(query: string): Promise<SearchResponse> {
  // Sanitize query
  // Call quran-repository search function with LIKE pattern
  // Map results to SearchResult with snippet extraction
  // Return items and total count
}
```

### New Data Access Layer

#### course-repository.ts

```typescript
// $lib/data/repositories/course-repository.ts
export interface CourseRow {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAllCourses(): Promise<CourseRow[]> { /* SELECT * FROM COURSE ORDER BY created_at */ }
export async function getCourseById(id: number): Promise<CourseRow | null> { /* SELECT by id */ }
export async function insertCourse(name: string, avatarUrl?: string): Promise<number> { /* INSERT, return id */ }
export async function updateCourseName(id: number, name: string): Promise<void> { /* UPDATE name, updated_at */ }
export async function updateCourseAvatar(id: number, avatarUrl: string): Promise<void> { /* UPDATE avatar_url */ }
export async function deleteCourseAndData(id: number): Promise<void> {
  // DELETE FROM TOPIC_VERSE WHERE topic_id IN (SELECT id FROM TOPIC WHERE course_id = ?)
  // DELETE FROM TOPIC WHERE course_id = ?
  // DELETE FROM BOOKMARK WHERE course_id = ?
  // DELETE FROM COURSE_SETTINGS WHERE course_id = ?
  // DELETE FROM COURSE WHERE id = ?
}
export async function duplicateCourse(sourceId: number, newName: string): Promise<number> {
  // INSERT new COURSE
  // Copy BOOKMARK records with new course_id
  // Copy TOPIC records, then TOPIC_VERSE records with new topic_ids
  // Copy COURSE_SETTINGS with new course_id
  // Return new course id
}
export async function getCourseCount(): Promise<number> { /* SELECT COUNT(*) FROM COURSE */ }
```

#### bookmark-repository.ts

```typescript
// $lib/data/repositories/bookmark-repository.ts
export interface BookmarkRow {
  id: number;
  course_id: number;
  surah_number: number;
  verse_number: number;
  label: string | null;
  note: string | null;
  created_at: string;
}

export interface BookmarkGroup {
  surahNumber: number;
  surahNameArabic: string;
  bookmarks: BookmarkRow[];
}

export async function getBookmarksByCourse(courseId: number): Promise<BookmarkRow[]> { /* SELECT WHERE course_id */ }
export async function getBookmarksGroupedBySurah(courseId: number): Promise<BookmarkGroup[]> { /* JOIN with SURAH, group */ }
export async function getBookmarksForSurah(courseId: number, surahNumber: number): Promise<BookmarkRow[]> { /* SELECT WHERE course_id AND surah_number */ }
export async function isVerseBookmarked(courseId: number, surahNumber: number, verseNumber: number): Promise<boolean> { /* SELECT EXISTS */ }
export async function insertBookmark(courseId: number, surahNumber: number, verseNumber: number, label?: string, note?: string): Promise<number> { /* INSERT */ }
export async function updateBookmarkLabel(id: number, label: string): Promise<void> { /* UPDATE */ }
export async function updateBookmarkNote(id: number, note: string): Promise<void> { /* UPDATE */ }
export async function deleteBookmark(id: number): Promise<void> { /* DELETE */ }
```

#### topic-repository.ts

```typescript
// $lib/data/repositories/topic-repository.ts
export interface TopicRow {
  id: number;
  course_id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface TopicWithVerses extends TopicRow {
  verses: { surahNumber: number; verseNumber: number; surahNameArabic: string }[];
}

export async function getTopicsByCourse(courseId: number): Promise<TopicRow[]> { /* SELECT WHERE course_id */ }
export async function getTopicsWithVerses(courseId: number): Promise<TopicWithVerses[]> { /* JOIN TOPIC_VERSE, SURAH */ }
export async function insertTopic(courseId: number, name: string, description?: string): Promise<number> { /* INSERT */ }
export async function updateTopicName(id: number, name: string): Promise<void> { /* UPDATE */ }
export async function updateTopicDescription(id: number, description: string): Promise<void> { /* UPDATE */ }
export async function deleteTopic(id: number): Promise<void> { /* DELETE TOPIC_VERSE then TOPIC */ }
export async function addVerseToTopic(topicId: number, surahNumber: number, verseNumber: number): Promise<void> { /* INSERT TOPIC_VERSE */ }
export async function removeVerseFromTopic(topicId: number, surahNumber: number, verseNumber: number): Promise<void> { /* DELETE TOPIC_VERSE */ }
export async function isVerseInTopic(topicId: number, surahNumber: number, verseNumber: number): Promise<boolean> { /* SELECT EXISTS */ }
```

#### Extended quran-repository.ts (search addition)

```typescript
// Addition to $lib/data/repositories/quran-repository.ts
export interface VerseSearchResult {
  surahNumber: number;
  surahNameArabic: string;
  verseNumber: number;
  textArabic: string;
  textSimple: string;
}

export async function searchVersesInDb(query: string): Promise<VerseSearchResult[]> {
  // SELECT v.*, s.name_arabic FROM VERSE v
  // JOIN SURAH s ON v.surah_number = s.number
  // WHERE v.text_arabic LIKE '%' || ? || '%'
  //    OR v.text_simple LIKE '%' || ? || '%'
  // ORDER BY v.surah_number, v.verse_number
}
```

#### Extended settings-repository.ts (course selection)

```typescript
// Additions to $lib/data/repositories/settings-repository.ts
export async function getCourseSelection(courseId: number): Promise<{ lastSurah: number; lastVerse: number | null } | null> {
  // SELECT last_surah, last_verse FROM COURSE_SETTINGS WHERE course_id = ?
}

export async function saveCourseSelection(courseId: number, surahNumber: number, verseNumber: number | null): Promise<void> {
  // INSERT OR REPLACE INTO COURSE_SETTINGS (course_id, last_surah, last_verse)
}
```

## Data Models

### New Tables (Migration 002)

```
COURSE
├── id (PK, integer, auto-increment)
├── name (text, not null)
├── avatar_url (text, nullable)
├── created_at (text, not null)
└── updated_at (text, not null)

BOOKMARK
├── id (PK, integer, auto-increment)
├── course_id (FK → COURSE.id)
├── surah_number (integer, not null)
├── verse_number (integer, not null)
├── label (text, nullable)
├── note (text, nullable)
├── created_at (text, not null)
├── sync_version (integer, default 0)
└── UNIQUE(course_id, surah_number, verse_number)

TOPIC
├── id (PK, integer, auto-increment)
├── course_id (FK → COURSE.id)
├── name (text, not null)
├── description (text, nullable)
├── created_at (text, not null)
└── sync_version (integer, default 0)

TOPIC_VERSE
├── id (PK, integer, auto-increment)
├── topic_id (FK → TOPIC.id)
├── surah_number (integer, not null)
├── verse_number (integer, not null)
└── UNIQUE(topic_id, surah_number, verse_number)

COURSE_SETTINGS
├── id (PK, integer, auto-increment)
├── course_id (FK → COURSE.id, UNIQUE)
├── default_translation_id (integer, nullable)
├── last_surah (integer, nullable)
└── last_verse (integer, nullable)
```

### Migration SQL (002-courses.sql)

```sql
CREATE TABLE IF NOT EXISTS COURSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS BOOKMARK (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  label TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id),
  UNIQUE(course_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS TOPIC (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE TABLE IF NOT EXISTS TOPIC_VERSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES TOPIC(id),
  UNIQUE(topic_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS COURSE_SETTINGS (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL UNIQUE,
  default_translation_id INTEGER,
  last_surah INTEGER,
  last_verse INTEGER,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE INDEX IF NOT EXISTS idx_bookmark_course ON BOOKMARK(course_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_course_surah ON BOOKMARK(course_id, surah_number);
CREATE INDEX IF NOT EXISTS idx_topic_course ON TOPIC(course_id);
CREATE INDEX IF NOT EXISTS idx_topic_verse_topic ON TOPIC_VERSE(topic_id);
CREATE INDEX IF NOT EXISTS idx_course_settings_course ON COURSE_SETTINGS(course_id);

-- Update db_version
UPDATE APP_SETTINGS SET value = '2' WHERE key = 'db_version';
```

### Migration Runner Update

```typescript
// Updated $lib/data/migrations/index.ts
import initialSql from './001-initial.sql?raw';
import coursesSql from './002-courses.sql?raw';

export const migrations = [
  { version: 1, sql: initialSql },
  { version: 2, sql: coursesSql },
];
```

## Updated File Structure (Phase 2 additions)

```
client/src/lib/
├── components/
│   ├── navigation/
│   │   ├── NavigationBar.svelte        # Updated: tabs + course switcher
│   │   ├── NavigationTabs.svelte       # NEW
│   │   ├── CourseSwitcher.svelte       # NEW
│   │   ├── CourseDropdown.svelte       # NEW
│   │   ├── SearchPanel.svelte          # NEW
│   │   ├── SearchInput.svelte          # NEW
│   │   ├── SearchResultList.svelte     # NEW
│   │   ├── SearchResultItem.svelte     # NEW
│   │   ├── BookmarksPanel.svelte       # NEW
│   │   ├── BookmarkGroup.svelte        # NEW
│   │   ├── BookmarkItem.svelte         # NEW
│   │   ├── TopicsPanel.svelte          # NEW
│   │   ├── TopicItem.svelte            # NEW
│   │   ├── TopicVerseItem.svelte       # NEW
│   │   ├── TableOfContents.svelte      # Existing
│   │   ├── SurahListItem.svelte        # Existing
│   │   └── LanguageSwitcher.svelte     # Existing
│   ├── quran/
│   │   └── VerseItem.svelte            # Updated: bookmark icon
│   └── shared/
│       └── (existing)
├── state/
│   ├── course-context.svelte.ts        # NEW
│   ├── selection-context.svelte.ts     # Updated: per-course persistence
│   ├── i18n-context.svelte.ts          # Existing
│   └── ui-context.svelte.ts            # Existing
├── services/
│   ├── search-service.ts              # NEW
│   └── quran-service.ts               # Existing
├── data/
│   ├── migrations/
│   │   ├── 001-initial.sql            # Existing
│   │   ├── 002-courses.sql            # NEW
│   │   └── index.ts                   # Updated: add migration 002
│   └── repositories/
│       ├── course-repository.ts       # NEW
│       ├── bookmark-repository.ts     # NEW
│       ├── topic-repository.ts        # NEW
│       ├── quran-repository.ts        # Updated: search function
│       └── settings-repository.ts     # Updated: course selection
└── i18n/
    ├── fa.ts                          # Updated: new keys
    └── en.ts                          # Updated: new keys
```

### New i18n Keys

```typescript
// Additions to fa.ts and en.ts
{
  'course.default': 'پیش‌فرض' / 'Default',
  'course.create': 'ایجاد دوره جدید' / 'Create New Course',
  'course.rename': 'تغییر نام' / 'Rename',
  'course.delete': 'حذف' / 'Delete',
  'course.duplicate': 'کپی' / 'Duplicate',
  'course.delete_last_error': 'حداقل یک دوره باید وجود داشته باشد' / 'At least one course must exist',
  'course.copy_suffix': '(کپی)' / '(Copy)',
  'nav.tab.toc': 'فهرست' / 'Contents',
  'nav.tab.search': 'جستجو' / 'Search',
  'nav.tab.bookmarks': 'نشانه‌ها' / 'Bookmarks',
  'nav.tab.topics': 'موضوعات' / 'Topics',
  'search.placeholder': 'جستجو در قرآن...' / 'Search the Quran...',
  'search.no_results': 'نتیجه‌ای یافت نشد' / 'No results found',
  'search.result_count': '{count} نتیجه' / '{count} results',
  'bookmark.add': 'افزودن نشانه' / 'Add Bookmark',
  'bookmark.remove': 'حذف نشانه' / 'Remove Bookmark',
  'bookmark.already_exists': 'این آیه قبلاً نشانه‌گذاری شده' / 'This verse is already bookmarked',
  'bookmark.label': 'برچسب' / 'Label',
  'bookmark.note': 'یادداشت' / 'Note',
  'topic.create': 'ایجاد موضوع جدید' / 'Create New Topic',
  'topic.rename': 'تغییر نام' / 'Rename',
  'topic.delete': 'حذف' / 'Delete',
  'topic.add_verse': 'افزودن آیه' / 'Add Verse',
  'topic.remove_verse': 'حذف آیه' / 'Remove Verse',
  'topic.description': 'توضیحات' / 'Description',
  'topic.duplicate_verse': 'این آیه قبلاً به این موضوع اضافه شده' / 'This verse is already in this topic',
}
```

## Correctness Properties

### Property 1: Course Isolation
FOR ALL courses C1 and C2 where C1.id ≠ C2.id, bookmarks created in C1 SHALL NOT appear in queries scoped to C2, and topics created in C1 SHALL NOT appear in queries scoped to C2.

### Property 2: Bookmark Uniqueness
FOR ALL bookmark operations, inserting a bookmark for (course_id, surah_number, verse_number) that already exists SHALL fail with a constraint violation rather than creating a duplicate.

### Property 3: Topic-Verse Uniqueness
FOR ALL topic-verse operations, assigning a verse (surah_number, verse_number) to a topic that already contains it SHALL fail with a constraint violation rather than creating a duplicate.

### Property 4: Cascade Delete — Course
FOR ALL course deletions, deleting a course SHALL result in zero BOOKMARK, TOPIC, TOPIC_VERSE, and COURSE_SETTINGS records referencing that course_id.

### Property 5: Course Selection Round-Trip
FOR ALL valid Selection values and course IDs, saving a Selection to COURSE_SETTINGS and then restoring it SHALL produce an equivalent Selection object.

### Property 6: Search Result Validity
FOR ALL search queries that return results, every result's (surah_number, verse_number) SHALL correspond to an existing VERSE record, and the verse text SHALL contain the search query string.

### Property 7: Default Course Guarantee
AFTER application initialization, the total number of courses SHALL always be at least 1. Deleting the last course SHALL be prevented.

### Property 8: Course Duplication Completeness
FOR ALL course duplications, the new course SHALL have the same number of bookmarks, topics, and topic-verse assignments as the source course, with all records referencing the new course_id.
