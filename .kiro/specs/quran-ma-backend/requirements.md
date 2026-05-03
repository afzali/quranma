# Requirements Document — Quran Ma PHP Backend

## Introduction

The Quran Ma PHP backend provides a REST API for the Quran Ma client application (SvelteKit + Capacitor). It handles user authentication via JWT tokens, course-scoped data synchronization across devices, and serves Quran resource files (translations and tafsirs). The backend uses PHP with the Slim Framework, MySQL/MariaDB for storage, and Composer for dependency management. It lives in the `server/` directory.

## Glossary

- **Backend**: The PHP REST API server deployed in the `server/` directory
- **Client**: The Quran Ma SvelteKit + Capacitor application that consumes the Backend API
- **JWT**: JSON Web Token used for stateless authentication
- **Sync_Version**: An integer column on each syncable record, incremented by the Backend on every write, used for conflict detection
- **Sync_Push**: A POST request from the Client sending a single record change (insert, update, or delete) to the Backend
- **Sync_Pull**: A GET request from the Client fetching all user data for a specific course from the Backend
- **Force_Push**: A Sync_Push with `force: true`, indicating the user chose to overwrite the server version after a conflict
- **Syncable_Table**: Any of the 12 user data tables that participate in synchronization: bookmarks, topics, topic_verses, user_word_data, user_translations, user_tafsirs, siyaq_groups, siyaq_verses, nazm_kavi_items, nazm_kavi_verses, shabake_kavi_connections, eqameh_entries
- **Resource**: A translation or tafsir dataset available for download by the Client
- **Router**: The Slim Framework routing layer that dispatches HTTP requests to handler functions
- **Middleware**: A function that intercepts requests before they reach the route handler, used for authentication checks

## Requirements

### Requirement 1: Project Structure and Configuration

**User Story:** As a developer, I want a well-organized PHP project with Composer dependency management and environment-based configuration, so that the backend is easy to set up, deploy, and maintain.

#### Acceptance Criteria

1. THE Backend SHALL use Composer for dependency management with a `composer.json` file in the `server/` directory
2. THE Backend SHALL use the Slim Framework as the HTTP routing layer
3. THE Backend SHALL load configuration values from a `.env` file in the `server/` directory
4. THE Backend SHALL define database connection parameters (host, port, database name, username, password) as environment variables
5. THE Backend SHALL define a JWT secret key as an environment variable
6. WHEN the `.env` file is missing or a required environment variable is not set, THE Backend SHALL terminate with a descriptive error message

### Requirement 2: Database Schema

**User Story:** As a developer, I want a MySQL/MariaDB database schema that mirrors the client-side syncable tables and stores user accounts and resources, so that data can be persisted and synchronized.

#### Acceptance Criteria

1. THE Backend SHALL create a `users` table with columns: id (auto-increment PK), username (unique, not null), password_hash (not null), created_at (timestamp)
2. THE Backend SHALL create a `courses` table with columns: id (auto-increment PK), user_id (FK to users), name (not null), avatar_url (nullable), created_at (timestamp), updated_at (timestamp)
3. THE Backend SHALL create one table for each Syncable_Table with the same column structure as the client-side schema, plus a user_id (FK to users), course_id (FK to courses), and sync_version (integer, default 1) column
4. THE Backend SHALL create a `translation_resources` table with columns: id (auto-increment PK), name (not null), language (not null), translator (not null)
5. THE Backend SHALL create a `translation_entries` table with columns: id (auto-increment PK), resource_id (FK to translation_resources), surah_number (integer, not null), verse_number (integer, not null), text_content (text, not null)
6. THE Backend SHALL create a `tafsir_resources` table with columns: id (auto-increment PK), name (not null), author (not null)
7. THE Backend SHALL create a `tafsir_entries` table with columns: id (auto-increment PK), resource_id (FK to tafsir_resources), surah_number (integer, not null), verse_number (integer, not null), text_content (text, not null)
8. THE Backend SHALL provide SQL migration files in a `server/migrations/` directory

### Requirement 3: Authentication — Login

**User Story:** As a user, I want to log in with my username and password, so that I can access my synced data from any device.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/auth/login` with a valid JSON body containing `username` and `password` fields, THE Backend SHALL verify the credentials against the `users` table using bcrypt comparison
2. WHEN the credentials are valid, THE Backend SHALL return HTTP 200 with a JSON body `{ "token": "<jwt_token>", "username": "<username>" }`
3. WHEN the credentials are invalid, THE Backend SHALL return HTTP 401 with a JSON body `{ "error": "Invalid credentials" }`
4. THE Backend SHALL generate JWT tokens with the user id and username as claims, signed with the JWT secret key from the environment
5. THE Backend SHALL set JWT token expiration to 30 days
6. IF the request body is missing `username` or `password`, THEN THE Backend SHALL return HTTP 400 with a JSON body `{ "error": "Username and password are required" }`

### Requirement 4: Authentication — Logout

**User Story:** As a user, I want to log out, so that my session is invalidated.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/auth/logout` with a valid Authorization header, THE Backend SHALL return HTTP 200 with a JSON body `{ "ok": true }`
2. IF the Authorization header is missing or the token is invalid, THEN THE Backend SHALL return HTTP 401 with a JSON body `{ "error": "Unauthorized" }`

### Requirement 5: Authentication Middleware

**User Story:** As a developer, I want protected routes to automatically verify JWT tokens, so that unauthorized requests are rejected consistently.

#### Acceptance Criteria

1. THE Middleware SHALL extract the Bearer token from the `Authorization` header on protected routes
2. WHEN the token is valid and not expired, THE Middleware SHALL attach the authenticated user id and username to the request and pass it to the route handler
3. IF the Authorization header is missing, THEN THE Middleware SHALL return HTTP 401 with `{ "error": "Unauthorized" }`
4. IF the token is expired or has an invalid signature, THEN THE Middleware SHALL return HTTP 401 with `{ "error": "Unauthorized" }`

### Requirement 6: Sync Push

**User Story:** As a user, I want to push local data changes to the server, so that my data is backed up and available on other devices.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/sync/push` with a valid token and a JSON body containing `table_name`, `record_id`, `operation`, `course_id`, and `payload`, THE Backend SHALL process the operation on the corresponding Syncable_Table
2. WHEN the operation is `insert`, THE Backend SHALL insert the payload as a new record with sync_version set to 1 and return HTTP 200 with `{ "ok": true, "sync_version": 1 }`
3. WHEN the operation is `update` and the record's current sync_version matches the client's expected version, THE Backend SHALL update the record, increment sync_version by 1, and return HTTP 200 with `{ "ok": true, "sync_version": <new_version> }`
4. WHEN the operation is `update` and the record's current sync_version does not match the client's expected version, THE Backend SHALL return HTTP 409 with `{ "conflict": true, "remote_data": <current_record>, "remote_sync_version": <current_version> }`
5. WHEN the operation is `delete`, THE Backend SHALL delete the record and return HTTP 200 with `{ "ok": true, "sync_version": 0 }`
6. WHEN the `force` field is `true`, THE Backend SHALL overwrite the record regardless of sync_version and return HTTP 200
7. THE Backend SHALL verify that the course belongs to the authenticated user before processing any sync operation
8. IF the `table_name` is not a valid Syncable_Table name, THEN THE Backend SHALL return HTTP 400 with `{ "error": "Invalid table name" }`
9. IF the `course_id` does not belong to the authenticated user, THEN THE Backend SHALL return HTTP 403 with `{ "error": "Forbidden" }`

### Requirement 7: Sync Pull

**User Story:** As a user, I want to pull all my data for a course from the server, so that I can restore or sync my data on a new device.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/sync/pull` with a valid token and a `course_id` query parameter, THE Backend SHALL return HTTP 200 with a JSON body containing all records from every Syncable_Table for that user and course
2. THE Backend SHALL structure the response as `{ "tables": { "bookmarks": [...], "topics": [...], ... } }` with one key per Syncable_Table
3. THE Backend SHALL verify that the course belongs to the authenticated user before returning data
4. IF the `course_id` does not belong to the authenticated user, THEN THE Backend SHALL return HTTP 403 with `{ "error": "Forbidden" }`
5. IF the `course_id` query parameter is missing, THEN THE Backend SHALL return HTTP 400 with `{ "error": "course_id is required" }`

### Requirement 8: Resource Listing

**User Story:** As a user, I want to browse available translations and tafsirs, so that I can choose which resources to download.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/resources/translations`, THE Backend SHALL return HTTP 200 with a JSON array of all translation resources, each containing `id`, `name`, `language`, `translator`, and `download_url`
2. WHEN a GET request is received at `/api/resources/tafsirs`, THE Backend SHALL return HTTP 200 with a JSON array of all tafsir resources, each containing `id`, `name`, `author`, and `download_url`
3. THE Backend SHALL construct the `download_url` field as `/api/resources/translations/{id}/download` or `/api/resources/tafsirs/{id}/download` respectively
4. THE Backend SHALL serve resource listing endpoints without requiring authentication

### Requirement 9: Resource Download

**User Story:** As a user, I want to download translation and tafsir data, so that I can use them offline in the client application.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/resources/translations/{id}/download`, THE Backend SHALL return HTTP 200 with a JSON array of translation entries, each containing `surah_number`, `verse_number`, and `text_content`
2. WHEN a GET request is received at `/api/resources/tafsirs/{id}/download`, THE Backend SHALL return HTTP 200 with a JSON array of tafsir entries, each containing `surah_number`, `verse_number`, and `text_content`
3. IF the resource id does not exist, THEN THE Backend SHALL return HTTP 404 with `{ "error": "Resource not found" }`
4. THE Backend SHALL serve resource download endpoints without requiring authentication

### Requirement 10: Data Import CLI Tools

**User Story:** As an administrator, I want CLI scripts to import Quran translations and tafsirs from JSON files, so that I can populate the resource database.

#### Acceptance Criteria

1. THE Backend SHALL provide a CLI script `server/cli/import-translation.php` that reads a JSON file and inserts records into the `translation_resources` and `translation_entries` tables
2. THE Backend SHALL provide a CLI script `server/cli/import-tafsir.php` that reads a JSON file and inserts records into the `tafsir_resources` and `tafsir_entries` tables
3. WHEN the JSON file path is not provided as a command-line argument, THE CLI script SHALL print a usage message and exit with code 1
4. WHEN the JSON file does not exist or is not valid JSON, THE CLI script SHALL print a descriptive error message and exit with code 1
5. THE CLI scripts SHALL use database transactions to ensure atomicity of the import operation

### Requirement 11: Error Handling and Response Format

**User Story:** As a client developer, I want consistent JSON error responses from all endpoints, so that error handling in the client is predictable.

#### Acceptance Criteria

1. THE Backend SHALL return all responses with `Content-Type: application/json`
2. WHEN an unhandled exception occurs, THE Backend SHALL return HTTP 500 with `{ "error": "Internal server error" }` and log the exception details to a server log file
3. WHEN a request body contains invalid JSON, THE Backend SHALL return HTTP 400 with `{ "error": "Invalid JSON" }`
4. THE Backend SHALL include CORS headers allowing requests from any origin for all responses

### Requirement 12: User Management

**User Story:** As an administrator, I want to create user accounts via a CLI tool, so that users can be provisioned without a public registration endpoint.

#### Acceptance Criteria

1. THE Backend SHALL provide a CLI script `server/cli/create-user.php` that accepts a username and password as command-line arguments and inserts a new user into the `users` table with a bcrypt-hashed password
2. IF the username already exists, THEN THE CLI script SHALL print an error message and exit with code 1
3. WHEN the user is created successfully, THE CLI script SHALL print the username and exit with code 0
