# Tasks — Quran Ma Phase 3: Analysis Panel

## Task 1: Database Migration 003 — Analysis Tables

- [ ] 1.1 Create `src/lib/data/migrations/003-analysis.sql` with CREATE TABLE statements for USER_WORD_DATA, USER_TRANSLATION, USER_TAFSIR, TRANSLATION_RESOURCE, TRANSLATION_ENTRY, TAFSIR_RESOURCE, TAFSIR_ENTRY, SIYAQ_GROUP, SIYAQ_VERSE, NAZM_KAVI_ITEM, NAZM_KAVI_VERSE, SHABAKE_KAVI_CONNECTION, and EQAMEH_ENTRY tables including foreign keys, unique constraints, CHECK constraints, and indexes
- [ ] 1.2 Update `src/lib/data/migrations/index.ts` to register migration 003 in the migrations array
- [ ] 1.3 Verify migration runs successfully on app startup by checking that all tables are created and db_version is updated to 3

## Task 2: Word Data Repository

- [ ] 2.1 Create `src/lib/data/repositories/word-data-repository.ts` with getUserWordData function that returns all USER_WORD_DATA records for a given course, surah, and verse
- [ ] 2.2 Add upsertUserWordData function that inserts or replaces a USER_WORD_DATA record for a given course, surah, verse, and word position with personal_meaning, selected_meaning, and note fields

## Task 3: Translation Repository

- [ ] 3.1 Create `src/lib/data/repositories/translation-repository.ts` with getUserTranslation and upsertUserTranslation functions for managing USER_TRANSLATION records per course and verse

## Task 4: Tafsir Repository

- [ ] 4.1 Create `src/lib/data/repositories/tafsir-repository.ts` with getUserTafsir and upsertUserTafsir functions for managing USER_TAFSIR records per course and verse

## Task 5: Resource Repository

- [ ] 5.1 Create `src/lib/data/repositories/resource-repository.ts` with getAllTranslationResources, getTranslationResource, getDownloadedTranslationEntriesForVerse, insertTranslationEntries, and markTranslationDownloaded functions
- [ ] 5.2 Add getAllTafsirResources, getTafsirResource, getDownloadedTafsirEntriesForVerse, insertTafsirEntries, and markTafsirDownloaded functions to resource-repository.ts

## Task 6: Siyaq Repository

- [ ] 6.1 Create `src/lib/data/repositories/siyaq-repository.ts` with getSiyaqGroupsForSurah function that joins SIYAQ_GROUP with SIYAQ_VERSE and returns groups with their member verses
- [ ] 6.2 Add insertSiyaqGroup, updateSiyaqGroup, deleteSiyaqGroup, and setSiyaqVerses functions for full CRUD on siyaq groups and their verse assignments

## Task 7: Nazm-Kavi Repository

- [ ] 7.1 Create `src/lib/data/repositories/nazm-kavi-repository.ts` with getNazmKaviItemsByCourse, getNazmKaviItemWithVerses, and getNazmKaviItemsByType query functions
- [ ] 7.2 Add insertNazmKaviItem, updateNazmKaviItem, deleteNazmKaviItem, and setNazmKaviVerses functions for full CRUD on nazm-kavi items and their verse assignments

## Task 8: Shabake-Kavi Repository

- [ ] 8.1 Create `src/lib/data/repositories/shabake-kavi-repository.ts` with getConnectionsForVerse and getConnectionsByType query functions
- [ ] 8.2 Add insertConnection, updateConnection, and deleteConnection functions for full CRUD on shabake-kavi connections

## Task 9: Eqameh Repository

- [ ] 9.1 Create `src/lib/data/repositories/eqameh-repository.ts` with getEqamehEntriesForSurah and getEqamehEntriesByType query functions
- [ ] 9.2 Add insertEqamehEntry, updateEqamehEntry, and deleteEqamehEntry functions for full CRUD on eqameh entries

## Task 10: Extend Course Repository for Phase 3 Cascade

- [ ] 10.1 Update deleteCourseAndData in `course-repository.ts` to delete USER_WORD_DATA, USER_TRANSLATION, USER_TAFSIR, SIYAQ_VERSE (via SIYAQ_GROUP), SIYAQ_GROUP, NAZM_KAVI_VERSE (via NAZM_KAVI_ITEM), NAZM_KAVI_ITEM, SHABAKE_KAVI_CONNECTION, and EQAMEH_ENTRY records for the deleted course
- [ ] 10.2 Update duplicateCourse in `course-repository.ts` to copy all Phase 3 course-scoped records (USER_WORD_DATA, USER_TRANSLATION, USER_TAFSIR, SIYAQ_GROUP with SIYAQ_VERSE, NAZM_KAVI_ITEM with NAZM_KAVI_VERSE, SHABAKE_KAVI_CONNECTION, EQAMEH_ENTRY) to the new course

## Task 11: Highlight Context State Module

- [ ] 11.1 Create `src/lib/state/highlight-context.svelte.ts` with VerseHighlight interface, reactive highlights map, showAllSiyaq toggle, and activeNazmKaviId state
- [ ] 11.2 Add getVerseHighlight, setShowAllSiyaq, setActiveNazmKaviId, setSiyaqHighlights, setNazmKaviHighlights, and clearAllHighlights functions

## Task 12: Highlight Service

- [ ] 12.1 Create `src/lib/services/highlight-service.ts` with loadSiyaqHighlights function that reads siyaq groups from the repository and updates highlight-context
- [ ] 12.2 Add loadNazmKaviHighlights function that reads a nazm-kavi item's verses from the repository and updates highlight-context
- [ ] 12.3 Add clearHighlightsForCourseSwitch function that clears all highlights when the active course changes

## Task 13: Resource Service

- [ ] 13.1 Create `src/lib/services/resource-service.ts` with downloadTranslationResource function that fetches translation data from the download URL, stores entries in TRANSLATION_ENTRY, and marks the resource as downloaded
- [ ] 13.2 Add downloadTafsirResource function that fetches tafsir data from the download URL, stores entries in TAFSIR_ENTRY, and marks the resource as downloaded

## Task 14: Analysis Tabs Shell

- [ ] 14.1 Create `src/lib/components/analysis/AnalysisTabs.svelte` with a tabbed interface containing seven tabs using shadcn-rtl Tabs component, with tab labels from i18n
- [ ] 14.2 Replace AnalysisPlaceholder with AnalysisTabs in `+page.svelte` (AppShell) — the left pane now renders AnalysisTabs
- [ ] 14.3 Add tab persistence to APP_SETTINGS so the last active analysis tab is restored on relaunch

## Task 15: Word Analysis Tab Components

- [ ] 15.1 Create `WordCard.svelte` in `src/lib/components/analysis/` displaying a single word's Arabic text, root, default meaning, derivatives, and editable fields for personal meaning, selected meaning, and note
- [ ] 15.2 Create `WordAnalysisTab.svelte` in `src/lib/components/analysis/` that loads words from WORD table and user word data from USER_WORD_DATA for the selected verse and active course, rendering a list of WordCard components
- [ ] 15.3 Wire WordCard edits to upsertUserWordData so changes are persisted to the database

## Task 16: Translation Tab Components

- [ ] 16.1 Create `TranslationResourceList.svelte` in `src/lib/components/analysis/` displaying available translation resources with download status and download button
- [ ] 16.2 Create `TranslationEntry.svelte` in `src/lib/components/analysis/` displaying a single translation with translator name and language label
- [ ] 16.3 Create `PersonalTranslationEditor.svelte` in `src/lib/components/analysis/` with text area for personal translation and note, wired to upsertUserTranslation
- [ ] 16.4 Create `TranslationTab.svelte` in `src/lib/components/analysis/` composing TranslationResourceList, TranslationEntry list for downloaded resources, PersonalTranslationEditor, and a "Set as Default" action that updates COURSE_SETTINGS

## Task 17: Tafsir Tab Components

- [ ] 17.1 Create `TafsirResourceList.svelte` in `src/lib/components/analysis/` displaying available tafsir resources with download status and download button
- [ ] 17.2 Create `TafsirEntry.svelte` in `src/lib/components/analysis/` displaying a single tafsir with author name label
- [ ] 17.3 Create `PersonalTafsirEditor.svelte` in `src/lib/components/analysis/` with text area for personal tafsir and note, wired to upsertUserTafsir
- [ ] 17.4 Create `TafsirTab.svelte` in `src/lib/components/analysis/` composing TafsirResourceList, TafsirEntry list for downloaded resources, and PersonalTafsirEditor

## Task 18: Siyaq Tab Components

- [ ] 18.1 Create `SiyaqGroupCard.svelte` in `src/lib/components/analysis/` displaying a siyaq group's title, color swatch, description, and member verse list with edit and delete actions
- [ ] 18.2 Create `SiyaqGroupEditor.svelte` in `src/lib/components/analysis/` with form fields for title, color picker, description, and verse selection for creating or editing a siyaq group
- [ ] 18.3 Create `SiyaqToggle.svelte` in `src/lib/components/analysis/` with a toggle switch for "Show all siyaq" that updates highlight-context
- [ ] 18.4 Create `SiyaqTab.svelte` in `src/lib/components/analysis/` composing SiyaqToggle, SiyaqGroupCard list, and SiyaqGroupEditor, loading data for the current surah and active course

## Task 19: Nazm-Kavi Tab Components

- [ ] 19.1 Create `NazmKaviItemCard.svelte` in `src/lib/components/analysis/` displaying a nazm-kavi item's type badge, title, description, related verses, and activate/edit/delete actions
- [ ] 19.2 Create `NazmKaviItemEditor.svelte` in `src/lib/components/analysis/` with form fields for type selector, title, description, and verse selection
- [ ] 19.3 Create `NazmKaviTypeFilter.svelte` in `src/lib/components/analysis/` with filter buttons for repetition, contrast, axis, and pattern types
- [ ] 19.4 Create `NazmKaviTab.svelte` in `src/lib/components/analysis/` composing NazmKaviTypeFilter, NazmKaviItemCard list, and NazmKaviItemEditor, with activate action wiring to highlight-service

## Task 20: Shabake-Kavi Tab Components

- [ ] 20.1 Create `ConnectionCard.svelte` in `src/lib/components/analysis/` displaying a connection's target type icon, title, description, target reference, and navigate/edit/delete actions
- [ ] 20.2 Create `ConnectionEditor.svelte` in `src/lib/components/analysis/` with form fields for target type selector, target reference, title, and description
- [ ] 20.3 Create `ShabakeKaviTab.svelte` in `src/lib/components/analysis/` composing ConnectionCard list grouped by target type and ConnectionEditor, with navigate action for verse-type connections

## Task 21: Eqameh Tab Components

- [ ] 21.1 Create `EqamehEntryCard.svelte` in `src/lib/components/analysis/` displaying an eqameh entry's type badge, text content, verse/surah level indicator, and edit/delete actions
- [ ] 21.2 Create `EqamehEntryEditor.svelte` in `src/lib/components/analysis/` with form fields for type selector, text content, and optional verse number
- [ ] 21.3 Create `EqamehTab.svelte` in `src/lib/components/analysis/` composing EqamehEntryCard list grouped by type and EqamehEntryEditor, loading data for the current surah and active course

## Task 22: Integrate Highlight System with QuranDisplay

- [ ] 22.1 Update `VerseItem.svelte` to import highlight-context and read getVerseHighlight for the verse's surah and verse number
- [ ] 22.2 Apply siyaq background color styling to VerseItem when a siyaqColor highlight is present
- [ ] 22.3 Apply nazm-kavi visual marker (border or icon) to VerseItem when nazmKaviActive highlight is present
- [ ] 22.4 Ensure highlight styles do not interfere with the existing verse selection highlight from Phase 1

## Task 23: Course Switch Integration

- [ ] 23.1 Wire highlight-context clearAllHighlights into the course-context switchCourse flow so highlights are cleared and reloaded when the active course changes
- [ ] 23.2 Ensure all analysis tab components react to course changes by reloading their data from the new active course

## Task 24: i18n Updates

- [ ] 24.1 Add all Phase 3 translation keys to `src/lib/i18n/fa.ts` (analysis tabs, word analysis, translation, tafsir, siyaq, nazm-kavi, shabake-kavi, eqameh labels)
- [ ] 24.2 Add all Phase 3 translation keys to `src/lib/i18n/en.ts` matching every key in fa.ts
- [ ] 24.3 Verify all new components use the t() function for all user-visible text

## Task 25: Integration and Verification

- [ ] 25.1 Verify migration 003 runs successfully on a database with existing Phase 1 and Phase 2 data without data loss
- [ ] 25.2 Verify Word Analysis tab: select verse → words displayed → add personal meaning → switch course → personal meaning not visible → switch back → personal meaning restored
- [ ] 25.3 Verify Translation tab: download a resource → translations appear for selected verse → add personal translation → persisted per course
- [ ] 25.4 Verify Tafsir tab: download a resource → tafsirs appear for selected verse → add personal tafsir → persisted per course
- [ ] 25.5 Verify Siyaq tab: create group with color → assign verses → toggle "Show all siyaq" → verses highlighted in Quran Display → delete group → highlights removed
- [ ] 25.6 Verify Nazm-Kavi tab: create item → assign verses → activate → verses marked in Quran Display → filter by type → only matching items shown
- [ ] 25.7 Verify Shabake-Kavi tab: create connection to another verse → navigate action scrolls to target verse → create connection to external source → displayed correctly
- [ ] 25.8 Verify Eqameh tab: create verse-level entry → create surah-level entry → both displayed grouped by type → edit and delete work correctly
- [ ] 25.9 Verify course deletion cascade: create analysis data in a course → delete course → all Phase 3 data for that course is removed
- [ ] 25.10 Verify course duplication: create analysis data in a course → duplicate course → all Phase 3 data is copied to the new course
