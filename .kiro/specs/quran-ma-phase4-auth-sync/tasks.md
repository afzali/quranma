# Tasks — Quran Ma Phase 4: Authentication and Sync

## Task 1: Database Migration 004 — Auth and Sync Tables

- [ ] 1.1 Create `src/lib/data/migrations/004-auth-sync.sql` with CREATE TABLE statement for SYNC_QUEUE (id, table_name, record_id, operation with CHECK constraint, course_id, payload, created_at) and index on course_id, plus UPDATE APP_SETTINGS db_version to 4
- [ ] 1.2 Update `src/lib/data/migrations/index.ts` to import 004-auth-sync.sql and register migration version 4 in the migrations array
- [ ] 1.3 Verify migration runs successfully on a database with existing Phase 1-3 data without data loss

## Task 2: Sync Queue Repository

- [ ] 2.1 Create `src/lib/data/repositories/sync-queue-repository.ts` with insertQueueEntry function that inserts a SYNC_QUEUE record with table_name, record_id, operation, course_id, JSON payload, and created_at
- [ ] 2.2 Add getQueueEntries function that returns all SYNC_QUEUE records ordered by id ASC, and getQueueEntryById function for single entry lookup
- [ ] 2.3 Add getQueueCount function returning the total number of queue entries, and getQueueEntriesByCourse function filtered by course_id
- [ ] 2.4 Add deleteQueueEntry (by id), clearSyncQueue (delete all), and clearSyncQueueForCourse (delete by course_id) functions

## Task 3: Settings Repository Update

- [ ] 3.1 Add deleteSetting function to `src/lib/data/repositories/settings-repository.ts` that deletes a row from APP_SETTINGS by key

## Task 4: Sync Helpers

- [ ] 4.1 Create `src/lib/data/sync-helpers.ts` with enqueueIfAuthenticated function that checks auth state and inserts a SYNC_QUEUE entry only when the user is authenticated

## Task 5: Auth Context State Module

- [ ] 5.1 Create `src/lib/state/auth-context.svelte.ts` with reactive state for isAuthenticated, username, and authToken, plus getter functions getIsAuthenticated, getUsername, getAuthToken
- [ ] 5.2 Add setAuthState function (sets token, username, isAuthenticated=true), clearAuthState function (clears all), and initAuthContext function that restores auth state from APP_SETTINGS on startup

## Task 6: Network Context State Module

- [ ] 6.1 Create `src/lib/state/network-context.svelte.ts` with reactive isOnline state, getIsOnline getter, and initNetworkContext function that reads initial status from @capacitor/network and registers a networkStatusChange listener

## Task 7: Sync Context State Module

- [ ] 7.1 Create `src/lib/state/sync-context.svelte.ts` with SyncStatus type (idle, syncing, error, offline), SyncConflict interface, and reactive state for syncStatus, conflicts array, and pendingCount
- [ ] 7.2 Add getter functions (getSyncStatus, getConflicts, getConflictCount, getPendingCount), setter functions (setSyncStatus, setPendingCount), addConflict, resolveConflict, and clearConflicts functions

## Task 8: API Client

- [ ] 8.1 Create `src/lib/services/api-client.ts` with apiGet and apiPost functions that attach the Auth_Token as Bearer header, handle 401 responses by clearing auth state, and return typed ApiResponse objects
- [ ] 8.2 Add base URL configuration (read from APP_SETTINGS key "api_base_url") with getBaseUrl and setBaseUrl functions

## Task 9: Auth Service

- [ ] 9.1 Create `src/lib/services/auth-service.ts` with login function that POSTs credentials to /api/auth/login, stores token and username in APP_SETTINGS, and updates auth-context state
- [ ] 9.2 Add logout function that removes auth_token and auth_username from APP_SETTINGS, clears the SYNC_QUEUE, and clears auth-context state
- [ ] 9.3 Add restoreAuth function that reads auth_token and auth_username from APP_SETTINGS and sets auth-context state if both exist

## Task 10: Sync Service

- [ ] 10.1 Create `src/lib/services/sync-service.ts` with processSyncQueue function that iterates SYNC_QUEUE entries in order, sends each to /api/sync/push, handles success (delete entry, update sync_version), and stops on network error
- [ ] 10.2 Add conflict handling: when /api/sync/push returns 409, parse remote data and add to sync-context conflicts array
- [ ] 10.3 Add retryWithBackoff function implementing exponential backoff (1s, 2s, 4s, 8s, 16s capped at 30s) with max 5 attempts for server errors (5xx)
- [ ] 10.4 Add resolveConflictOnServer function that either force-pushes local data or applies remote data locally based on user choice
- [ ] 10.5 Add pullDataFromServer function that GETs /api/sync/pull?course_id={id} and inserts/updates all returned records into the local database
- [ ] 10.6 Add fetchResourceList function that GETs /api/resources/translations and /api/resources/tafsirs and upserts into local TRANSLATION_RESOURCE and TAFSIR_RESOURCE tables

## Task 11: Update Resource Service for PHP Backend

- [ ] 11.1 Update downloadTranslationResource in `resource-service.ts` to use api-client's apiGet for fetching translation data from the PHP backend download URL
- [ ] 11.2 Update downloadTafsirResource in `resource-service.ts` to use api-client's apiGet for fetching tafsir data from the PHP backend download URL

## Task 12: Integrate Sync Queue into Existing Repositories

- [ ] 12.1 Update `bookmark-repository.ts` — add enqueueIfAuthenticated calls after insertBookmark, updateBookmarkLabel, updateBookmarkNote, and deleteBookmark
- [ ] 12.2 Update `topic-repository.ts` — add enqueueIfAuthenticated calls after insertTopic, updateTopicName, updateTopicDescription, deleteTopic, addVerseToTopic, and removeVerseFromTopic
- [ ] 12.3 Update `word-data-repository.ts` — add enqueueIfAuthenticated call after upsertUserWordData
- [ ] 12.4 Update `translation-repository.ts` — add enqueueIfAuthenticated call after upsertUserTranslation
- [ ] 12.5 Update `tafsir-repository.ts` — add enqueueIfAuthenticated call after upsertUserTafsir
- [ ] 12.6 Update `siyaq-repository.ts` — add enqueueIfAuthenticated calls after insertSiyaqGroup, updateSiyaqGroup, deleteSiyaqGroup, and setSiyaqVerses
- [ ] 12.7 Update `nazm-kavi-repository.ts` — add enqueueIfAuthenticated calls after insertNazmKaviItem, updateNazmKaviItem, deleteNazmKaviItem, and setNazmKaviVerses
- [ ] 12.8 Update `shabake-kavi-repository.ts` — add enqueueIfAuthenticated calls after insertConnection, updateConnection, and deleteConnection
- [ ] 12.9 Update `eqameh-repository.ts` — add enqueueIfAuthenticated calls after insertEqamehEntry, updateEqamehEntry, and deleteEqamehEntry
- [ ] 12.10 Update `course-repository.ts` — add enqueueIfAuthenticated calls after insertCourse, updateCourseName, and deleteCourseAndData (queue course-level sync operations)

## Task 13: Login Page Component

- [ ] 13.1 Create `src/lib/components/auth/LoginPage.svelte` with username input, password input, submit button, loading state, and error display, using i18n for all labels
- [ ] 13.2 Wire form submission to auth-service login function, handle success (close login page) and error (display message)
- [ ] 13.3 Add network error detection — display offline message when login fails due to network

## Task 14: User Profile and Login Button Components

- [ ] 14.1 Create `src/lib/components/auth/LoginButton.svelte` that renders a button navigating to the login page, shown when not authenticated
- [ ] 14.2 Create `src/lib/components/auth/UserProfile.svelte` that displays the username and a logout button, shown when authenticated
- [ ] 14.3 Wire logout button to auth-service logout function

## Task 15: Network Indicator Component

- [ ] 15.1 Create `src/lib/components/shared/NetworkIndicator.svelte` that reads network-context isOnline state and displays a green dot (online) or red dot (offline) with tooltip text from i18n

## Task 16: Sync Status and Conflict UI

- [ ] 16.1 Create `src/lib/components/shared/SyncStatusIndicator.svelte` that shows sync icon (spinning when syncing), pending count badge, and conflict count badge
- [ ] 16.2 Create `src/lib/components/shared/ConflictDialog.svelte` as a modal dialog showing local vs remote data side by side with "Keep Local" and "Keep Remote" buttons
- [ ] 16.3 Wire ConflictDialog resolution buttons to sync-context resolveConflict and sync-service resolveConflictOnServer

## Task 17: Navigation Bar Integration

- [ ] 17.1 Update `NavigationBar.svelte` to include UserProfile/LoginButton at the top (conditionally rendered based on auth state)
- [ ] 17.2 Add NetworkIndicator and SyncStatusIndicator to NavigationBar below the user profile area
- [ ] 17.3 Add ConflictDialog rendering in AppShell (+page.svelte), triggered when conflict count > 0

## Task 18: App Initialization Updates

- [ ] 18.1 Update `+layout.svelte` to call initNetworkContext() during app startup (after database init)
- [ ] 18.2 Update `+layout.svelte` to call restoreAuth() from auth-service during app startup (after database init)
- [ ] 18.3 Add startup logic: if authenticated and online, call fetchResourceList() and processSyncQueue() after auth is restored
- [ ] 18.4 Wire network-context online transition: when device goes from offline to online and user is authenticated, trigger processSyncQueue()

## Task 19: i18n Updates

- [ ] 19.1 Add all Phase 4 translation keys to `src/lib/i18n/fa.ts` (auth, network, sync, conflict, resource labels)
- [ ] 19.2 Add all Phase 4 translation keys to `src/lib/i18n/en.ts` matching every key in fa.ts
- [ ] 19.3 Verify all new components use the t() function for all user-visible text

## Task 20: Integration and Verification

- [ ] 20.1 Verify migration 004 runs successfully on a database with existing Phase 1-3 data without data loss
- [ ] 20.2 Verify login flow: enter credentials → token stored → UserProfile shown → app restart → auth restored without re-login
- [ ] 20.3 Verify logout flow: tap logout → token removed → sync queue cleared → LoginButton shown
- [ ] 20.4 Verify offline behavior: all features work without login, bookmarks/topics/analysis fully functional offline
- [ ] 20.5 Verify sync queue: create bookmark while authenticated → SYNC_QUEUE entry created → go online → entry sent to server → entry deleted from queue
- [ ] 20.6 Verify conflict resolution: simulate 409 response → conflict dialog shown → choose local → local version pushed → choose remote → local record updated
- [ ] 20.7 Verify network indicator: go offline → red indicator shown → go online → green indicator shown → sync triggered automatically
- [ ] 20.8 Verify resource download: fetch resource list from server → download translation → entries stored locally → available offline
- [ ] 20.9 Verify course sync: create course while authenticated → course creation queued → delete course → deletion queued → sync processes both operations
- [ ] 20.10 Verify 401 handling: simulate expired token → API returns 401 → auth state cleared → user shown login button
