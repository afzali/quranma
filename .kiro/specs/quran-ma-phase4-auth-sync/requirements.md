# Requirements Document — Quran Ma Phase 4: Authentication and Sync

## Introduction

Phase 4 adds optional authentication and data synchronization to the Quran Ma application. Users can optionally log in via a PHP backend to sync their course-scoped study data (bookmarks, topics, word data, translations, tafsirs, siyaq, nazm-kavi, shabake-kavi, eqameh) across devices. All features continue to work fully offline without login. When logged in and online, changes are synced automatically. When offline, changes are queued and retried on reconnect. Conflict resolution preserves both local and remote versions, prompting the user to choose. Phase 4 also connects the Translation and Tafsir resource download system (designed in Phase 3) to the actual PHP backend.

## Glossary

- **App**: The Quran Ma client application (SvelteKit + Capacitor), as established in Phase 1
- **User**: A person interacting with the App
- **Active_Course**: The currently selected Course (from Phase 2)
- **Local_Database**: The SQLite database stored on the user's device (from Phase 1)
- **PHP_Backend**: The remote REST API server that handles authentication, data sync, and resource hosting
- **Auth_Service**: Client-side service responsible for authenticating against the PHP_Backend, storing tokens, and managing auth state
- **Auth_Token**: A bearer token returned by the PHP_Backend upon successful login, stored locally in APP_SETTINGS
- **Sync_Service**: Client-side service responsible for synchronizing User_Data between the Local_Database and the PHP_Backend
- **User_Data**: Course-scoped records that are synced: BOOKMARK, TOPIC, TOPIC_VERSE, USER_WORD_DATA, USER_TRANSLATION, USER_TAFSIR, SIYAQ_GROUP, SIYAQ_VERSE, NAZM_KAVI_ITEM, NAZM_KAVI_VERSE, SHABAKE_KAVI_CONNECTION, and EQAMEH_ENTRY
- **Sync_Queue**: A local table that records pending changes (inserts, updates, deletes) to User_Data that have not yet been sent to the PHP_Backend
- **Sync_Version**: An integer field on each syncable record used to detect conflicts between local and remote data
- **Network_Status**: The current online/offline state of the device, detected via @capacitor/network
- **Navigation_Bar**: The right-side panel containing course switcher, tabs, and user profile (from Phase 2)
- **Login_Page**: A dedicated page where the User enters username and password to authenticate
- **Resource_Download**: The process of fetching Translation and Tafsir resource data from the PHP_Backend and storing it locally
- **Conflict**: A state where both local and remote versions of a record have been modified since the last sync (detected by differing sync_version values)

---

## Requirements

### Requirement 1: Database Migration 004 — Auth and Sync Tables

**User Story:** As a developer, I want the database extended with auth and sync tables, so that the application can store authentication tokens and queue offline changes for sync.

#### Acceptance Criteria

1. THE App SHALL run a database migration (004) on startup that creates all Phase 4 tables
2. THE SYNC_QUEUE table SHALL store: id (primary key, auto-increment), table_name (text), record_id (integer), operation (text: insert, update, or delete), course_id (integer), payload (text, nullable — JSON snapshot of the record), and created_at (text)
3. THE App SHALL store the Auth_Token in the existing APP_SETTINGS table using the key "auth_token"
4. THE App SHALL store the authenticated username in APP_SETTINGS using the key "auth_username"
5. THE Local_Database SHALL create an index on SYNC_QUEUE(course_id) for efficient queue queries

---

### Requirement 2: Authentication Service

**User Story:** As a user, I want to optionally log in with my username and password, so that I can sync my study data across devices.

#### Acceptance Criteria

1. WHEN the User submits valid credentials on the Login_Page, THE Auth_Service SHALL send a POST request to the PHP_Backend login endpoint and store the returned Auth_Token in APP_SETTINGS
2. WHEN the PHP_Backend returns an authentication error, THE Auth_Service SHALL display the error message to the User without storing a token
3. WHEN the User logs out, THE Auth_Service SHALL remove the Auth_Token and auth_username from APP_SETTINGS and clear the Sync_Queue
4. THE Auth_Service SHALL provide a function to check whether the User is currently authenticated by verifying the presence of a valid Auth_Token in APP_SETTINGS
5. WHEN the App starts, THE Auth_Service SHALL restore the authentication state from APP_SETTINGS without requiring the User to log in again
6. WHEN the PHP_Backend returns a 401 Unauthorized response during any API call, THE Auth_Service SHALL clear the stored Auth_Token and transition the User to an unauthenticated state
7. THE App SHALL function with all features (reading, bookmarks, topics, analysis) without requiring login

---

### Requirement 3: Login and Logout UI

**User Story:** As a user, I want a login page and a profile indicator in the navigation bar, so that I can manage my authentication status.

#### Acceptance Criteria

1. THE App SHALL provide a Login_Page with username and password input fields and a submit button
2. WHEN the User is not authenticated, THE Navigation_Bar SHALL display a "Login" button that navigates to the Login_Page
3. WHEN the User is authenticated, THE Navigation_Bar SHALL display the username and a "Logout" button
4. WHEN the User taps the "Logout" button, THE App SHALL log the User out via the Auth_Service and update the Navigation_Bar to show the "Login" button
5. WHILE the login request is in progress, THE Login_Page SHALL display a loading indicator and disable the submit button
6. IF the login request fails due to network error, THEN THE Login_Page SHALL display a message indicating the device is offline or the server is unreachable
7. THE Login_Page and Navigation_Bar auth elements SHALL display labels in the active locale using the I18n_Engine

---

### Requirement 4: Network Status Detection

**User Story:** As a user, I want the app to detect my online/offline status, so that sync operations happen automatically when I'm connected.

#### Acceptance Criteria

1. THE App SHALL use @capacitor/network to detect the current network connection status (online or offline)
2. WHEN the network status changes, THE App SHALL update the Network_Status state reactively
3. WHILE the device is offline, THE App SHALL display a visual indicator in the Navigation_Bar showing the offline status
4. WHEN the device transitions from offline to online and the User is authenticated, THE Sync_Service SHALL process the Sync_Queue automatically
5. THE App SHALL check the network status on startup and set the initial Network_Status state accordingly

---

### Requirement 5: Sync Queue Management

**User Story:** As a developer, I want changes to syncable data queued locally, so that they can be sent to the server when the device is online.

#### Acceptance Criteria

1. WHEN the User creates, updates, or deletes a User_Data record while authenticated, THE App SHALL insert a corresponding entry into the SYNC_QUEUE with the table_name, record_id, operation, course_id, and a JSON payload snapshot of the record
2. WHEN the User is not authenticated, THE App SHALL not insert entries into the SYNC_QUEUE
3. THE Sync_Queue SHALL preserve the order of operations by using the auto-increment id as the ordering key
4. WHEN a sync operation succeeds for a queue entry, THE Sync_Service SHALL delete that entry from the SYNC_QUEUE
5. WHEN the User logs out, THE App SHALL delete all entries from the SYNC_QUEUE

---

### Requirement 6: Data Synchronization

**User Story:** As a user, I want my study data synced to the server when I'm logged in and online, so that I can access it from other devices.

#### Acceptance Criteria

1. WHEN the User is authenticated and online, THE Sync_Service SHALL process pending Sync_Queue entries by sending each change to the PHP_Backend in order
2. WHEN the Sync_Service sends a change to the PHP_Backend, THE Sync_Service SHALL include the Auth_Token in the request Authorization header
3. WHEN the PHP_Backend confirms a sync operation, THE Sync_Service SHALL update the local record's sync_version to match the server's version and delete the queue entry
4. IF a sync request fails due to a network error, THEN THE Sync_Service SHALL stop processing the queue and retry when the device comes back online
5. IF a sync request fails due to a server error (5xx), THEN THE Sync_Service SHALL retry the request with exponential backoff (1s, 2s, 4s, max 30s) up to 5 attempts before stopping
6. THE Sync_Service SHALL sync User_Data per course, sending the course_id with each request so the PHP_Backend can associate data with the correct course
7. WHEN the App starts and the User is authenticated and online, THE Sync_Service SHALL process any pending Sync_Queue entries from previous sessions

---

### Requirement 7: Conflict Resolution

**User Story:** As a user, I want to be notified when my local changes conflict with remote changes, so that I can choose which version to keep.

#### Acceptance Criteria

1. WHEN the PHP_Backend returns a conflict response (HTTP 409) indicating the remote sync_version differs from the local sync_version, THE Sync_Service SHALL mark the queue entry as conflicted and store the remote version data
2. WHEN a conflict is detected, THE App SHALL display a conflict resolution dialog showing both the local version and the remote version of the record
3. WHEN the User chooses the local version, THE Sync_Service SHALL force-push the local record to the PHP_Backend with the updated sync_version
4. WHEN the User chooses the remote version, THE Sync_Service SHALL update the local record with the remote data and sync_version, and delete the queue entry
5. WHILE conflicts remain unresolved, THE App SHALL display a badge or indicator showing the number of pending conflicts
6. THE conflict resolution dialog SHALL display record details in a human-readable format appropriate to the record type (bookmark label, topic name, translation text, etc.)

---

### Requirement 8: Resource Download from PHP Backend

**User Story:** As a user, I want to download translation and tafsir resources from the server, so that I can access them offline.

#### Acceptance Criteria

1. WHEN the User requests to download a Translation_Resource, THE App SHALL fetch the resource data from the PHP_Backend download endpoint using the resource's download_url
2. WHEN the User requests to download a Tafsir_Resource, THE App SHALL fetch the resource data from the PHP_Backend download endpoint using the resource's download_url
3. WHEN the App starts and is online, THE App SHALL fetch the list of available Translation_Resources and Tafsir_Resources from the PHP_Backend and update the local TRANSLATION_RESOURCE and TAFSIR_RESOURCE tables
4. WHILE a resource download is in progress, THE App SHALL display a progress indicator in the Translation_Tab or Tafsir_Tab
5. IF a resource download fails due to a network error, THEN THE App SHALL display an error message and allow the User to retry the download
6. WHEN the download completes, THE App SHALL store the entries in TRANSLATION_ENTRY or TAFSIR_ENTRY and set is_downloaded to 1 on the resource record
7. THE resource download SHALL work regardless of authentication status — resource downloads do not require login

---

### Requirement 9: Auth and Sync Integration with Course System

**User Story:** As a developer, I want sync operations scoped to courses, so that each course's data is synced independently.

#### Acceptance Criteria

1. THE Sync_Service SHALL include the course_id in every sync request to the PHP_Backend
2. WHEN a Course is deleted locally while authenticated, THE Sync_Service SHALL queue a course deletion operation that the PHP_Backend processes to remove all associated User_Data on the server
3. WHEN a Course is created locally while authenticated, THE Sync_Service SHALL queue a course creation operation so the PHP_Backend creates a corresponding course record
4. WHEN the User logs in for the first time on a new device, THE Sync_Service SHALL pull all existing User_Data from the PHP_Backend and populate the Local_Database
5. THE Sync_Service SHALL not sync COURSE_SETTINGS (last_surah, last_verse, default_translation_id) — these remain local-only preferences

