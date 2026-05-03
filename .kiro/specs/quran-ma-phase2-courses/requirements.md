# Requirements Document — Quran Ma Phase 2: Course System and Navigation

## Introduction

Phase 2 builds on the foundation established in Phase 1 (SvelteKit + Capacitor + Electron, three-panel layout, i18n, SQLite, Table of Contents, Quran text display, and Selection context). This phase introduces the Course system — isolated workspaces for organizing Quran study — along with Search, Bookmarks, Topics, and course-scoped Selection.

Phase 2 does not include authentication, cloud sync, Android deployment, or analysis tools — those are deferred to later phases.

## Glossary

- **App**: The Quran Ma client application (SvelteKit + Capacitor), as established in Phase 1
- **User**: A person interacting with the App
- **Course**: An isolated workspace that groups bookmarks, topics, and settings. Each Course has a name, avatar, and its own study context
- **Default_Course**: A Course automatically created on first launch when no courses exist, named "Default"
- **Course_Switcher**: A UI component in the Navigation_Bar that allows the User to switch between courses and manage them
- **Active_Course**: The Course currently selected by the User. All user data operations are scoped to the Active_Course
- **Bookmark**: A saved reference to a specific verse within a Course, with optional label and note
- **Topic**: A named grouping of verses within a Course, used to organize study themes
- **Topic_Verse**: An association between a Topic and a specific verse
- **Search_Panel**: A UI component in the Navigation_Bar that allows the User to search Arabic Quran text
- **Bookmarks_Panel**: A UI component in the Navigation_Bar that displays bookmarks for the Active_Course grouped by Surah
- **Topics_Panel**: A UI component in the Navigation_Bar that displays topics for the Active_Course
- **Navigation_Bar**: The right-side panel (from Phase 1), now extended with Course_Switcher, Search_Panel, Bookmarks_Panel, and Topics_Panel
- **Quran_Display**: The center panel that renders Quran text (from Phase 1)
- **Local_Database**: The SQLite database stored on the user's device (from Phase 1)
- **Selection**: The currently active Surah or Verse, now scoped to the Active_Course
- **Course_Context**: The state module managing the Active_Course and course-related operations
- **Course_Settings**: Per-course preferences including default translation and last viewed position

---

## Requirements

### Requirement 1: Course Database Schema

**User Story:** As a developer, I want the database extended with course-related tables, so that the application can store courses, bookmarks, topics, and per-course settings.

#### Acceptance Criteria

1. THE App SHALL run a database migration (002) on startup that creates the COURSE, BOOKMARK, TOPIC, TOPIC_VERSE, and COURSE_SETTINGS tables
2. THE COURSE table SHALL store: id (primary key, auto-increment), name (text, not null), avatar_url (text, nullable), created_at (text, not null), and updated_at (text, not null)
3. THE BOOKMARK table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), surah_number (integer, not null), verse_number (integer, not null), label (text, nullable), note (text, nullable), created_at (text, not null), and sync_version (integer, default 0)
4. THE TOPIC table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), name (text, not null), description (text, nullable), created_at (text, not null), and sync_version (integer, default 0)
5. THE TOPIC_VERSE table SHALL store: id (primary key, auto-increment), topic_id (foreign key to TOPIC), surah_number (integer, not null), and verse_number (integer, not null)
6. THE COURSE_SETTINGS table SHALL store: id (primary key, auto-increment), course_id (foreign key to COURSE), default_translation_id (integer, nullable), last_surah (integer, nullable), and last_verse (integer, nullable)
7. THE Local_Database SHALL enforce a unique constraint on BOOKMARK(course_id, surah_number, verse_number) to prevent duplicate bookmarks for the same verse in a course
8. THE Local_Database SHALL enforce a unique constraint on TOPIC_VERSE(topic_id, surah_number, verse_number) to prevent duplicate verse assignments within a topic
9. THE Local_Database SHALL enforce a unique constraint on COURSE_SETTINGS(course_id) to ensure one settings record per course

---

### Requirement 2: Course Management

**User Story:** As a user, I want to create, rename, delete, and duplicate courses, so that I can organize my Quran study into separate workspaces.

#### Acceptance Criteria

1. WHEN no Course exists in the Local_Database on application startup, THE App SHALL automatically create a Default_Course named "Default"
2. WHEN the User creates a new Course, THE App SHALL insert a new COURSE record with the provided name and set it as the Active_Course
3. WHEN the User renames a Course, THE App SHALL update the name field of the corresponding COURSE record and update the updated_at timestamp
4. WHEN the User deletes a Course, THE App SHALL delete the COURSE record and all associated BOOKMARK, TOPIC, TOPIC_VERSE, and COURSE_SETTINGS records
5. IF the User attempts to delete the last remaining Course, THEN THE App SHALL prevent the deletion and display a localized message explaining that at least one course must exist
6. WHEN the User duplicates a Course, THE App SHALL create a new COURSE record with the name "{original name} (Copy)" and copy all associated BOOKMARK, TOPIC, TOPIC_VERSE, and COURSE_SETTINGS records to the new course
7. WHEN the User sets an avatar for a Course, THE App SHALL store the avatar URL in the COURSE record's avatar_url field
8. THE App SHALL persist the Active_Course identifier in APP_SETTINGS so that the last active course is restored on next launch

---

### Requirement 3: Course Switcher

**User Story:** As a user, I want a course switcher in the navigation bar, so that I can quickly switch between my courses and manage them.

#### Acceptance Criteria

1. THE Course_Switcher SHALL be displayed at the top of the Navigation_Bar, above the existing Table of Contents
2. THE Course_Switcher SHALL display the Active_Course name and avatar
3. WHEN the User clicks the Course_Switcher, THE App SHALL display a dropdown listing all available courses
4. WHEN the User selects a different Course from the dropdown, THE App SHALL set it as the Active_Course, load its COURSE_SETTINGS, and restore the last viewed Surah and verse for that course
5. THE Course_Switcher dropdown SHALL include options to create a new course, rename the active course, duplicate the active course, and delete the active course
6. THE Course_Switcher SHALL display all UI labels in the active locale using the I18n_Engine

---

### Requirement 4: Search

**User Story:** As a user, I want to search the Arabic Quran text, so that I can find specific verses or words quickly.

#### Acceptance Criteria

1. THE Search_Panel SHALL be accessible as a tab or section within the Navigation_Bar
2. WHEN the User enters a search query, THE Search_Panel SHALL search the text_arabic and text_simple columns of the VERSE table using a SQL LIKE pattern match
3. WHEN search results are found, THE Search_Panel SHALL display each result showing the Surah name, verse number, and a text snippet with the matching portion highlighted
4. WHEN no results are found, THE Search_Panel SHALL display a localized "no results" message
5. WHEN the User clicks a search result, THE App SHALL set the Selection to the corresponding Surah and verse, and THE Quran_Display SHALL scroll to and highlight that verse
6. WHILE the User is typing a search query, THE Search_Panel SHALL debounce the search execution by 300 milliseconds to avoid excessive database queries
7. THE Search_Panel SHALL display the total count of matching verses above the results list

---

### Requirement 5: Bookmarks

**User Story:** As a user, I want to bookmark verses within a course, so that I can save and revisit important verses during my study.

#### Acceptance Criteria

1. WHEN the User bookmarks a verse, THE App SHALL create a BOOKMARK record associated with the Active_Course, the verse's Surah number, and the verse number
2. WHEN the User removes a bookmark, THE App SHALL delete the corresponding BOOKMARK record from the Local_Database
3. IF the User attempts to bookmark a verse that is already bookmarked in the Active_Course, THEN THE App SHALL prevent the duplicate and indicate that the verse is already bookmarked
4. WHEN the User adds or edits a label for a bookmark, THE App SHALL update the label field of the corresponding BOOKMARK record
5. WHEN the User adds or edits a note for a bookmark, THE App SHALL update the note field of the corresponding BOOKMARK record
6. THE Bookmarks_Panel SHALL display all bookmarks for the Active_Course grouped by Surah, showing the Surah name as the group header
7. WHEN the User clicks a bookmark in the Bookmarks_Panel, THE App SHALL set the Selection to the bookmarked Surah and verse, and THE Quran_Display SHALL scroll to and highlight that verse
8. THE Quran_Display SHALL visually indicate which verses in the current Surah are bookmarked in the Active_Course by displaying a bookmark icon alongside the verse

---

### Requirement 6: Topics

**User Story:** As a user, I want to create topics and assign verses to them within a course, so that I can organize my study by theme.

#### Acceptance Criteria

1. WHEN the User creates a topic, THE App SHALL create a TOPIC record associated with the Active_Course with the provided name and optional description
2. WHEN the User renames a topic, THE App SHALL update the name field of the corresponding TOPIC record
3. WHEN the User deletes a topic, THE App SHALL delete the TOPIC record and all associated TOPIC_VERSE records
4. WHEN the User assigns a verse to a topic, THE App SHALL create a TOPIC_VERSE record linking the topic to the verse's Surah number and verse number
5. WHEN the User removes a verse from a topic, THE App SHALL delete the corresponding TOPIC_VERSE record
6. IF the User attempts to assign a verse that is already assigned to the same topic, THEN THE App SHALL prevent the duplicate assignment
7. THE Topics_Panel SHALL display all topics for the Active_Course, and each topic SHALL be expandable to show its assigned verses grouped by Surah
8. WHEN the User clicks a verse within a topic in the Topics_Panel, THE App SHALL set the Selection to the corresponding Surah and verse, and THE Quran_Display SHALL scroll to and highlight that verse
9. WHEN the User edits a topic description, THE App SHALL update the description field of the corresponding TOPIC record

---

### Requirement 7: Course-Scoped Selection

**User Story:** As a user, I want my reading position to be remembered per course, so that switching courses restores where I left off.

#### Acceptance Criteria

1. WHEN the Active_Course changes, THE App SHALL save the current Selection (Surah number and verse number) to the previous course's COURSE_SETTINGS record
2. WHEN the Active_Course changes, THE App SHALL restore the Selection from the new Active_Course's COURSE_SETTINGS record (last_surah and last_verse)
3. IF the new Active_Course has no saved Selection in COURSE_SETTINGS, THEN THE App SHALL set the Selection to Surah Al-Fatiha (Surah 1)
4. WHEN the Selection changes within the Active_Course, THE App SHALL update the last_surah and last_verse fields in the Active_Course's COURSE_SETTINGS record
5. THE App SHALL continue to persist the global Active_Course identifier in APP_SETTINGS so that the correct course is restored on application launch

---

### Requirement 8: Navigation Bar Extension

**User Story:** As a user, I want the navigation bar to provide tabs for Table of Contents, Search, Bookmarks, and Topics, so that I can access all navigation features from one panel.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL display a tab bar below the Course_Switcher with tabs for: Table of Contents, Search, Bookmarks, and Topics
2. WHEN the User selects a tab, THE Navigation_Bar SHALL display the corresponding panel (TableOfContents, Search_Panel, Bookmarks_Panel, or Topics_Panel)
3. THE Navigation_Bar SHALL remember the last active tab and restore it when the App is relaunched
4. THE Navigation_Bar tab labels SHALL be displayed in the active locale using the I18n_Engine
5. WHEN the Active_Course changes, THE Bookmarks_Panel and Topics_Panel SHALL refresh to display data for the newly active course
