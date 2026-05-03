# Requirements Document — Quran Ma Phase 3: Analysis Panel

## Introduction

Phase 3 builds on the foundation (Phase 1) and course system (Phase 2) to deliver the Analysis Panel — the left-side panel that replaces the placeholder from Phase 1 with seven functional tabs. Each tab provides a distinct analytical lens for Quran study: Word Analysis, Translation, Tafsir, Siyaq, Nazm-Kavi, Shabake-Kavi, and Eqameh. All user-generated data is scoped to the Active_Course. A centralized Highlight System integrates with the Quran_Display to visually mark verses referenced by Siyaq groups and Nazm-Kavi items.

Phase 3 does not include authentication, cloud sync, Android deployment, or server-side features — those are deferred to later phases.

## Glossary

- **App**: The Quran Ma client application (SvelteKit + Capacitor), as established in Phase 1
- **User**: A person interacting with the App
- **Active_Course**: The currently selected Course (from Phase 2). All Phase 3 data is scoped to the Active_Course
- **Selection**: The currently active Surah or Verse (from Phase 1, course-scoped in Phase 2)
- **Analysis_Panel**: The left-side panel, now containing seven functional tabs
- **Quran_Display**: The center panel that renders Quran text (from Phase 1)
- **Local_Database**: The SQLite database stored on the user's device (from Phase 1)
- **Word_Analysis_Tab**: Tab displaying word-by-word breakdown of the selected verse
- **Translation_Tab**: Tab for viewing, downloading, and managing translations
- **Tafsir_Tab**: Tab for viewing, downloading, and managing tafsirs (exegeses)
- **Siyaq_Tab**: Tab for semantic grouping of verses within a Surah
- **Nazm_Kavi_Tab**: Tab for structural analysis patterns (repetition, contrast, axis, etc.)
- **Shabake_Kavi_Tab**: Tab for network connections between verses and external references
- **Eqameh_Tab**: Tab for practical takeaways (principles, duties, messages, decisions, actions)
- **Highlight_System**: Centralized mechanism that applies visual highlights to verses in the Quran_Display based on Siyaq colors and Nazm-Kavi markers
- **Translation_Resource**: A downloadable translation package with metadata (name, language, translator)
- **Tafsir_Resource**: A downloadable tafsir package with metadata (name, author)
- **Siyaq_Group**: A named, colored grouping of consecutive or related verses within a Surah
- **Nazm_Kavi_Item**: A structural analysis entry with a type (repetition, contrast, axis, pattern), title, description, and related verses
- **Shabake_Kavi_Connection**: A link from a source verse to a target (another verse, hadith, story, concept, external source, or video/lecture)
- **Eqameh_Entry**: A practical takeaway entry with a type (principle, duty, message, decision, action) at verse or Surah level

---

## Requirements

### Requirement 1: Analysis Panel Database Schema (Migration 003)

**User Story:** As a developer, I want the database extended with analysis-related tables, so that the application can store word data, translations, tafsirs, siyaq groups, nazm-kavi items, shabake-kavi connections, and eqameh entries.

#### Acceptance Criteria

1. THE App SHALL run a database migration (003) on startup that creates all Phase 3 tables
2. THE USER_WORD_DATA table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), surah_number, verse_number, word_position, personal_meaning (nullable), selected_meaning (nullable), note (nullable), and sync_version (default 0)
3. THE USER_TRANSLATION table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), surah_number, verse_number, personal_translation (nullable), note (nullable), and sync_version (default 0)
4. THE USER_TAFSIR table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), surah_number, verse_number, personal_tafsir (nullable), note (nullable), and sync_version (default 0)
5. THE TRANSLATION_RESOURCE table SHALL store: id (primary key, auto-increment), name, language, translator, is_downloaded (integer, default 0), and download_url
6. THE TRANSLATION_ENTRY table SHALL store: id (primary key, auto-increment), resource_id (foreign key to TRANSLATION_RESOURCE), surah_number, verse_number, and text_content
7. THE TAFSIR_RESOURCE table SHALL store: id (primary key, auto-increment), name, author, is_downloaded (integer, default 0), and download_url
8. THE TAFSIR_ENTRY table SHALL store: id (primary key, auto-increment), resource_id (foreign key to TAFSIR_RESOURCE), surah_number, verse_number, and text_content
9. THE SIYAQ_GROUP table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), surah_number, title, color, description (nullable), created_at, and sync_version (default 0)
10. THE SIYAQ_VERSE table SHALL store: id (primary key, auto-increment), siyaq_group_id (foreign key to SIYAQ_GROUP), surah_number, and verse_number
11. THE NAZM_KAVI_ITEM table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), type (text: repetition, contrast, axis, or pattern), title, description (nullable), created_at, and sync_version (default 0)
12. THE NAZM_KAVI_VERSE table SHALL store: id (primary key, auto-increment), nazm_kavi_id (foreign key to NAZM_KAVI_ITEM), surah_number, and verse_number
13. THE SHABAKE_KAVI_CONNECTION table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), source_surah, source_verse, target_type (text: verse, hadith, story, concept, external, video), target_reference, title, description (nullable), created_at, and sync_version (default 0)
14. THE EQAMEH_ENTRY table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), surah_number, verse_number (nullable for Surah-level entries), type (text: principle, duty, message, decision, or action), text_content, created_at, and sync_version (default 0)
15. THE Local_Database SHALL enforce a unique constraint on USER_WORD_DATA(course_id, surah_number, verse_number, word_position) to prevent duplicate word data per course
16. THE Local_Database SHALL enforce a unique constraint on USER_TRANSLATION(course_id, surah_number, verse_number) to ensure one personal translation per verse per course
17. THE Local_Database SHALL enforce a unique constraint on USER_TAFSIR(course_id, surah_number, verse_number) to ensure one personal tafsir per verse per course
18. THE Local_Database SHALL enforce a unique constraint on TRANSLATION_ENTRY(resource_id, surah_number, verse_number) to prevent duplicate entries per resource
19. THE Local_Database SHALL enforce a unique constraint on TAFSIR_ENTRY(resource_id, surah_number, verse_number) to prevent duplicate entries per resource
20. THE Local_Database SHALL enforce a unique constraint on SIYAQ_VERSE(siyaq_group_id, surah_number, verse_number) to prevent duplicate verse assignments within a siyaq group

---

### Requirement 2: Analysis Panel Shell and Tab Navigation

**User Story:** As a user, I want the analysis panel to provide seven tabs, so that I can switch between different analytical views of the Quran text.

#### Acceptance Criteria

1. THE Analysis_Panel SHALL replace the AnalysisPlaceholder from Phase 1 with a tabbed interface containing seven tabs: Word Analysis (واژه), Translation (ترجمه), Tafsir (تفسیر), Siyaq (سیاق), Nazm-Kavi (نظم‌کاوی), Shabake-Kavi (شبکه‌کاوی), and Eqameh (اقامه)
2. WHEN the User selects a tab, THE Analysis_Panel SHALL display the corresponding tab content
3. THE Analysis_Panel tab labels SHALL be displayed in the active locale using the I18n_Engine
4. THE Analysis_Panel SHALL remember the last active tab and restore it when the App is relaunched
5. WHEN the Active_Course changes, THE Analysis_Panel SHALL refresh all tab content to reflect data for the newly active course

---

### Requirement 3: Word Analysis Tab

**User Story:** As a user, I want to see a word-by-word breakdown of the selected verse, so that I can study the meaning and root of each Arabic word.

#### Acceptance Criteria

1. WHEN a verse is selected, THE Word_Analysis_Tab SHALL display a list of all words in the selected verse from the WORD table, showing: Arabic text, root, default meaning, and derivatives for each word
2. WHEN no verse is selected (Surah-level selection), THE Word_Analysis_Tab SHALL display a prompt asking the User to select a verse
3. WHEN the User adds a personal meaning for a word, THE App SHALL create or update a USER_WORD_DATA record for the Active_Course, storing the personal_meaning
4. WHEN the User changes the selected meaning for a word, THE App SHALL create or update a USER_WORD_DATA record for the Active_Course, storing the selected_meaning
5. WHEN the User adds a note for a word, THE App SHALL create or update a USER_WORD_DATA record for the Active_Course, storing the note
6. THE Word_Analysis_Tab SHALL display any existing personal meanings, selected meanings, and notes from USER_WORD_DATA for the Active_Course alongside the default word data
7. WHEN the Active_Course changes, THE Word_Analysis_Tab SHALL reload USER_WORD_DATA for the new course

---

### Requirement 4: Translation Tab

**User Story:** As a user, I want to view multiple translations of the selected verse and manage translation resources, so that I can compare interpretations.

#### Acceptance Criteria

1. WHEN a verse is selected, THE Translation_Tab SHALL display translations for that verse from all downloaded TRANSLATION_RESOURCE entries
2. THE Translation_Tab SHALL allow the User to view multiple translations simultaneously, each labeled with the translator name and language
3. WHEN the User requests to download a translation resource, THE App SHALL fetch the translation data, store it in TRANSLATION_ENTRY records, and set is_downloaded to 1 on the TRANSLATION_RESOURCE record
4. THE Translation_Tab SHALL indicate which translation resources are downloaded and which are available for download
5. WHEN the User sets a default translation for the Active_Course, THE App SHALL store the translation resource ID in the COURSE_SETTINGS default_translation_id field
6. WHEN the User adds a personal translation for a verse, THE App SHALL create or update a USER_TRANSLATION record for the Active_Course
7. WHEN the User adds a note on a translation for a verse, THE App SHALL store the note in the USER_TRANSLATION record for the Active_Course
8. THE Translation_Tab SHALL display any existing personal translation and notes from USER_TRANSLATION for the Active_Course
9. WHEN the Active_Course changes, THE Translation_Tab SHALL reload personal translations and the default translation setting for the new course

---

### Requirement 5: Tafsir Tab

**User Story:** As a user, I want to view multiple tafsirs of the selected verse and manage tafsir resources, so that I can study scholarly interpretations.

#### Acceptance Criteria

1. WHEN a verse is selected, THE Tafsir_Tab SHALL display tafsir entries for that verse from all downloaded TAFSIR_RESOURCE entries
2. THE Tafsir_Tab SHALL allow the User to view multiple tafsirs simultaneously, each labeled with the author name
3. WHEN the User requests to download a tafsir resource, THE App SHALL fetch the tafsir data, store it in TAFSIR_ENTRY records, and set is_downloaded to 1 on the TAFSIR_RESOURCE record
4. THE Tafsir_Tab SHALL indicate which tafsir resources are downloaded and which are available for download
5. WHEN the User adds a personal tafsir for a verse, THE App SHALL create or update a USER_TAFSIR record for the Active_Course
6. WHEN the User adds a note on a tafsir for a verse, THE App SHALL store the note in the USER_TAFSIR record for the Active_Course
7. THE Tafsir_Tab SHALL display any existing personal tafsir and notes from USER_TAFSIR for the Active_Course
8. WHEN the Active_Course changes, THE Tafsir_Tab SHALL reload personal tafsirs for the new course

---

### Requirement 6: Siyaq Tab

**User Story:** As a user, I want to define semantic groups of verses within a Surah, so that I can visualize thematic structure.

#### Acceptance Criteria

1. THE Siyaq_Tab SHALL display all Siyaq_Groups for the current Surah in the Active_Course, showing each group's title, color, description, and member verses
2. WHEN the User creates a Siyaq_Group, THE App SHALL create a SIYAQ_GROUP record for the Active_Course with the provided title, color, and optional description, and create SIYAQ_VERSE records for the assigned verses
3. WHEN the User edits a Siyaq_Group, THE App SHALL update the title, color, or description of the SIYAQ_GROUP record and update the SIYAQ_VERSE records
4. WHEN the User deletes a Siyaq_Group, THE App SHALL delete the SIYAQ_GROUP record and all associated SIYAQ_VERSE records
5. WHEN a verse is selected, THE Siyaq_Tab SHALL visually indicate which Siyaq_Group the selected verse belongs to
6. WHEN the User toggles "Show all siyaq," THE Highlight_System SHALL apply the color of each Siyaq_Group to all its member verses in the Quran_Display
7. WHEN the Active_Course changes, THE Siyaq_Tab SHALL reload Siyaq_Groups for the new course

---

### Requirement 7: Nazm-Kavi Tab

**User Story:** As a user, I want to annotate structural analysis patterns in the Quran text, so that I can study repetition, contrast, axis, and other structural features.

#### Acceptance Criteria

1. THE Nazm_Kavi_Tab SHALL display all Nazm_Kavi_Items for the Active_Course, showing each item's type, title, description, and related verses
2. WHEN the User creates a Nazm_Kavi_Item, THE App SHALL create a NAZM_KAVI_ITEM record for the Active_Course with the provided type (repetition, contrast, axis, or pattern), title, and optional description, and create NAZM_KAVI_VERSE records for the related verses
3. WHEN the User edits a Nazm_Kavi_Item, THE App SHALL update the type, title, or description of the NAZM_KAVI_ITEM record and update the NAZM_KAVI_VERSE records
4. WHEN the User deletes a Nazm_Kavi_Item, THE App SHALL delete the NAZM_KAVI_ITEM record and all associated NAZM_KAVI_VERSE records
5. WHEN the User activates a Nazm_Kavi_Item, THE Highlight_System SHALL apply visual markers to the related verses in the Quran_Display
6. THE Nazm_Kavi_Tab SHALL allow the User to filter items by type (repetition, contrast, axis, pattern)
7. WHEN the Active_Course changes, THE Nazm_Kavi_Tab SHALL reload Nazm_Kavi_Items for the new course

---

### Requirement 8: Shabake-Kavi Tab

**User Story:** As a user, I want to create network connections from a verse to related content, so that I can map relationships between Quran verses, hadiths, stories, concepts, and external sources.

#### Acceptance Criteria

1. WHEN a verse is selected, THE Shabake_Kavi_Tab SHALL display all Shabake_Kavi_Connections originating from the selected verse in the Active_Course
2. WHEN the User creates a connection, THE App SHALL create a SHABAKE_KAVI_CONNECTION record for the Active_Course with the source verse, target_type (verse, hadith, story, concept, external, or video), target_reference, title, and optional description
3. WHEN the User edits a connection, THE App SHALL update the corresponding SHABAKE_KAVI_CONNECTION record
4. WHEN the User deletes a connection, THE App SHALL delete the corresponding SHABAKE_KAVI_CONNECTION record
5. WHEN a connection targets another verse (target_type = verse), THE App SHALL allow the User to navigate to the target verse by setting the Selection
6. THE Shabake_Kavi_Tab SHALL group connections by target_type for organized display
7. WHEN the Active_Course changes, THE Shabake_Kavi_Tab SHALL reload connections for the new course

---

### Requirement 9: Eqameh Tab

**User Story:** As a user, I want to record practical takeaways from Quran study, so that I can capture principles, duties, messages, decisions, and actions.

#### Acceptance Criteria

1. THE Eqameh_Tab SHALL display all Eqameh_Entries for the current Surah in the Active_Course, grouped by type (principle, duty, message, decision, action)
2. WHEN the User creates an Eqameh_Entry, THE App SHALL create an EQAMEH_ENTRY record for the Active_Course with the provided type, text_content, and optional verse_number (null for Surah-level entries)
3. WHEN the User edits an Eqameh_Entry, THE App SHALL update the type, text_content, or verse_number of the corresponding EQAMEH_ENTRY record
4. WHEN the User deletes an Eqameh_Entry, THE App SHALL delete the corresponding EQAMEH_ENTRY record
5. THE Eqameh_Tab SHALL visually distinguish between verse-level and Surah-level entries
6. WHEN the Active_Course changes, THE Eqameh_Tab SHALL reload Eqameh_Entries for the new course

---

### Requirement 10: Highlight System

**User Story:** As a user, I want verses in the Quran display to be visually highlighted based on Siyaq colors and Nazm-Kavi markers, so that I can see analytical context while reading.

#### Acceptance Criteria

1. THE Highlight_System SHALL maintain a centralized map of verse highlights, where each verse can have multiple highlight types simultaneously (siyaq color, nazm-kavi marker, selection highlight)
2. WHEN the "Show all siyaq" toggle is active, THE Highlight_System SHALL apply the background color of each Siyaq_Group to its member verses in the Quran_Display
3. WHEN a Nazm_Kavi_Item is activated, THE Highlight_System SHALL apply a distinct visual marker (border or icon) to the related verses in the Quran_Display
4. WHEN the Active_Course changes, THE Highlight_System SHALL clear all highlights and reload highlight data for the new course
5. THE Highlight_System SHALL update the Quran_Display reactively when highlights are added, removed, or changed
6. THE Highlight_System SHALL not interfere with the existing verse selection highlight from Phase 1

---

### Requirement 11: Course Cascade for Phase 3 Data

**User Story:** As a developer, I want course deletion to cascade to all Phase 3 data, so that no orphaned records remain.

#### Acceptance Criteria

1. WHEN a Course is deleted, THE App SHALL delete all USER_WORD_DATA, USER_TRANSLATION, USER_TAFSIR, SIYAQ_GROUP, SIYAQ_VERSE, NAZM_KAVI_ITEM, NAZM_KAVI_VERSE, SHABAKE_KAVI_CONNECTION, and EQAMEH_ENTRY records associated with that course
2. WHEN a Course is duplicated, THE App SHALL copy all Phase 3 course-scoped records (USER_WORD_DATA, USER_TRANSLATION, USER_TAFSIR, SIYAQ_GROUP with SIYAQ_VERSE, NAZM_KAVI_ITEM with NAZM_KAVI_VERSE, SHABAKE_KAVI_CONNECTION, EQAMEH_ENTRY) to the new course
