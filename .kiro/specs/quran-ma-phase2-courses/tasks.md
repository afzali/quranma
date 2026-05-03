# Tasks — Quran Ma Phase 2: Course System and Navigation

## Task 1: Database Migration 002 — Course Tables

- [x] 1.1 Create `src/lib/data/migrations/002-courses.sql` with CREATE TABLE statements for COURSE, BOOKMARK, TOPIC, TOPIC_VERSE, and COURSE_SETTINGS tables including foreign keys, unique constraints, and indexes
- [ ] 1.2 Update `src/lib/data/migrations/index.ts` to register migration 002 in the migrations array
- [ ] 1.3 Verify migration runs successfully on app startup by checking that all five tables are created and db_version is updated to 2

## Task 2: Course Repository

- [ ] 2.1 Create `src/lib/data/repositories/course-repository.ts` with getAllCourses, getCourseById, insertCourse, updateCourseName, updateCourseAvatar, getCourseCount functions
- [ ] 2.2 Add deleteCourseAndData function that deletes TOPIC_VERSE, TOPIC, BOOKMARK, COURSE_SETTINGS, and COURSE records in correct order for a given course_id
- [ ] 2.3 Add duplicateCourse function that copies a course and all its associated BOOKMARK, TOPIC, TOPIC_VERSE, and COURSE_SETTINGS records with new IDs

## Task 3: Bookmark Repository

- [ ] 3.1 Create `src/lib/data/repositories/bookmark-repository.ts` with getBookmarksByCourse, getBookmarksForSurah, isVerseBookmarked, insertBookmark, deleteBookmark functions
- [ ] 3.2 Add getBookmarksGroupedBySurah function that joins BOOKMARK with SURAH and returns results grouped by Surah with Arabic name headers
- [ ] 3.3 Add updateBookmarkLabel and updateBookmarkNote functions for editing bookmark metadata

## Task 4: Topic Repository

- [ ] 4.1 Create `src/lib/data/repositories/topic-repository.ts` with getTopicsByCourse, insertTopic, updateTopicName, updateTopicDescription, deleteTopic functions
- [ ] 4.2 Add addVerseToTopic, removeVerseFromTopic, isVerseInTopic functions for managing TOPIC_VERSE records
- [ ] 4.3 Add getTopicsWithVerses function that joins TOPIC with TOPIC_VERSE and SURAH to return topics with their assigned verses and Surah names

## Task 5: Course Context State Module

- [ ] 5.1 Create `src/lib/state/course-context.svelte.ts` with Course interface, reactive state for activeCourse and allCourses, and getter functions (getActiveCourse, getActiveCourseId, getAllCourses)
- [ ] 5.2 Add initCourseContext function that loads all courses, creates Default_Course if none exist, and restores the active course from APP_SETTINGS
- [ ] 5.3 Add switchCourse function that saves current selection to previous course's COURSE_SETTINGS, updates active course, restores selection from new course's COURSE_SETTINGS, and persists active_course_id
- [ ] 5.4 Add createCourse, renameCourse, deleteCourse (with last-course guard), duplicateCourse, and setCourseAvatar functions that delegate to course-repository and refresh state
- [ ] 5.5 Wire initCourseContext into `+layout.svelte` initialization flow — after database init, before selection restore

## Task 6: Update Selection Context for Per-Course Persistence

- [ ] 6.1 Add getCourseSelection and saveCourseSelection functions to settings-repository.ts that read/write COURSE_SETTINGS (last_surah, last_verse) for a given course_id
- [ ] 6.2 Update persistSelection in selection-context.svelte.ts to write to COURSE_SETTINGS for the active course instead of APP_SETTINGS
- [ ] 6.3 Update restoreSelection in selection-context.svelte.ts to read from COURSE_SETTINGS for the active course, falling back to Surah 1 if no saved selection exists

## Task 7: Search Service and Repository Extension

- [ ] 7.1 Add searchVersesInDb function to quran-repository.ts that performs SQL LIKE search on text_arabic and text_simple columns, joining with SURAH for Surah names
- [ ] 7.2 Create `src/lib/services/search-service.ts` with searchVerses function that sanitizes the query, calls the repository, extracts text snippets with match positions, and returns SearchResponse with items and total count

## Task 8: Navigation Bar Restructure — Tabs and Course Switcher

- [ ] 8.1 Create `NavigationTabs.svelte` in `src/lib/components/navigation/` with tab bar for TOC, Search, Bookmarks, and Topics using shadcn-rtl Tabs component
- [ ] 8.2 Create `CourseSwitcher.svelte` in `src/lib/components/navigation/` displaying active course name and avatar with a dropdown trigger
- [ ] 8.3 Create `CourseDropdown.svelte` in `src/lib/components/navigation/` listing all courses with options to create, rename, duplicate, and delete
- [ ] 8.4 Update `NavigationBar.svelte` to render CourseSwitcher at the top, NavigationTabs below, and LanguageSwitcher at the bottom
- [ ] 8.5 Add tab persistence to APP_SETTINGS so the last active tab is restored on relaunch

## Task 9: Search Panel Components

- [ ] 9.1 Create `SearchInput.svelte` in `src/lib/components/navigation/` with a text input, RTL-aware placeholder, and clear button
- [ ] 9.2 Create `SearchResultItem.svelte` in `src/lib/components/navigation/` displaying Surah name, verse number, and text snippet with highlighted match
- [ ] 9.3 Create `SearchResultList.svelte` in `src/lib/components/navigation/` rendering a scrollable list of SearchResultItem components with a total count header
- [ ] 9.4 Create `SearchPanel.svelte` in `src/lib/components/navigation/` composing SearchInput and SearchResultList, implementing 300ms debounce on input, and wiring result clicks to selectVerse

## Task 10: Bookmarks Panel Components

- [ ] 10.1 Create `BookmarkItem.svelte` in `src/lib/components/navigation/` displaying verse reference, label, note preview, and click handler for navigation
- [ ] 10.2 Create `BookmarkGroup.svelte` in `src/lib/components/navigation/` displaying a Surah name header with a collapsible list of BookmarkItem components
- [ ] 10.3 Create `BookmarksPanel.svelte` in `src/lib/components/navigation/` that loads bookmarks for the active course grouped by Surah and renders BookmarkGroup components
- [ ] 10.4 Add bookmark toggle action to VerseItem.svelte — show a bookmark icon for bookmarked verses, allow adding/removing bookmarks via click

## Task 11: Topics Panel Components

- [ ] 11.1 Create `TopicVerseItem.svelte` in `src/lib/components/navigation/` displaying Surah name and verse number with click handler for navigation and remove button
- [ ] 11.2 Create `TopicItem.svelte` in `src/lib/components/navigation/` displaying topic name, description, expandable verse list, and actions (rename, delete, add verse)
- [ ] 11.3 Create `TopicsPanel.svelte` in `src/lib/components/navigation/` that loads topics for the active course and renders TopicItem components with a "Create Topic" button
- [ ] 11.4 Add "Add to Topic" action to the verse context — when a verse is selected, allow assigning it to an existing topic from a dropdown

## Task 12: i18n Updates

- [ ] 12.1 Add all Phase 2 translation keys to `src/lib/i18n/fa.ts` (course, search, bookmark, topic labels)
- [ ] 12.2 Add all Phase 2 translation keys to `src/lib/i18n/en.ts` matching every key in fa.ts
- [ ] 12.3 Verify all new components use the t() function for all user-visible text

## Task 13: Integration and Verification

- [ ] 13.1 Verify full course lifecycle: create course → switch to it → create bookmarks and topics → switch away → switch back → bookmarks and topics are preserved
- [ ] 13.2 Verify search: type query → results appear after debounce → click result → Quran_Display scrolls to verse
- [ ] 13.3 Verify course deletion cascade: delete a course with bookmarks and topics → all associated data is removed → app switches to another course
- [ ] 13.4 Verify default course creation: on fresh database (after migration 002), a Default course is created automatically
- [ ] 13.5 Verify per-course selection persistence: select a verse in Course A → switch to Course B → select different verse → switch back to Course A → original verse is restored
