# Tasks — Quran Ma PHP Backend

## Task 1: Project Setup and Configuration

- [ ] 1.1 Create `server/composer.json` with dependencies: `slim/slim`, `slim/psr7`, `firebase/php-jwt`, `vlucas/phpdotenv`
- [ ] 1.2 Create `server/public/index.php` entry point that bootstraps the Slim app, loads `.env`, registers middleware, and defines all routes
- [ ] 1.3 Create `server/src/Config.php` for environment variable access helpers
- [ ] 1.4 Create `server/src/Database/Connection.php` PDO singleton factory with MySQL connection using env vars
- [ ] 1.5 Create `server/.env.example` with all required environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, JWT_SECRET, APP_DEBUG)
- [ ] 1.6 Create `server/.htaccess` for Apache URL rewriting to `public/index.php`
- [ ] 1.7 Create `server/public/.htaccess` for Apache rewrite rules within public directory
- [ ] 1.8 Add PSR-4 autoload configuration in `composer.json` mapping `App\\` to `src/`

## Task 2: Database Schema and Migrations

- [ ] 2.1 Create `server/migrations/001-schema.sql` with the full database schema: users, courses, 12 syncable tables, translation_resources, translation_entries, tafsir_resources, tafsir_entries
- [ ] 2.2 Create `server/cli/migrate.php` CLI script that reads and executes SQL migration files against the database

## Task 3: Middleware

- [ ] 3.1 Create `server/src/Middleware/CorsMiddleware.php` that adds CORS headers (Access-Control-Allow-Origin: *, Allow-Methods, Allow-Headers) to all responses
- [ ] 3.2 Create `server/src/Middleware/JsonBodyParser.php` that parses JSON request bodies and attaches parsed data to the request
- [ ] 3.3 Create `server/src/Middleware/AuthMiddleware.php` that extracts Bearer token, decodes JWT, attaches user_id and username to request attributes, returns 401 on failure

## Task 4: Authentication API

- [ ] 4.1 Create `server/src/Services/AuthService.php` with `login(username, password)` method: query users table, verify bcrypt hash, generate JWT with 30-day expiry
- [ ] 4.2 Create `server/src/Handlers/AuthHandler.php` with `login()` method: validate request body, call AuthService, return token or 401
- [ ] 4.3 Add `logout()` method to AuthHandler: return `{ "ok": true }` (stateless — client deletes token)

## Task 5: Sync API

- [ ] 5.1 Create `server/src/Services/SyncService.php` with `verifyCourseOwnership(courseId, userId)` method
- [ ] 5.2 Implement `push()` method in SyncService: route to handleInsert/handleUpdate/handleDelete based on operation
- [ ] 5.3 Implement `handleInsert()`: build INSERT query from payload + user_id + course_id + sync_version=1
- [ ] 5.4 Implement `handleUpdate()`: fetch current record, check sync_version for conflicts (return 409), handle force flag, increment sync_version
- [ ] 5.5 Implement `handleDelete()`: DELETE by id + course_id + user_id, return sync_version 0
- [ ] 5.6 Implement `pull()`: query all 12 syncable tables for given course_id + user_id, return as keyed object
- [ ] 5.7 Create `server/src/Handlers/SyncHandler.php` with `push()` and `pull()` methods: validate input, check table whitelist, verify course ownership, delegate to SyncService

## Task 6: Resource API

- [ ] 6.1 Create `server/src/Services/ResourceService.php` with `getTranslations()` and `getTafsirs()` methods that query resource tables and append download_url
- [ ] 6.2 Add `getTranslationEntries(id)` and `getTafsirEntries(id)` methods: verify resource exists (return null if not), query entries ordered by surah_number, verse_number
- [ ] 6.3 Create `server/src/Handlers/ResourceHandler.php` with `listTranslations()`, `listTafsirs()`, `downloadTranslation()`, `downloadTafsir()` methods

## Task 7: CLI Admin Tools

- [ ] 7.1 Create `server/cli/create-user.php`: accept username and password as CLI args, hash password with bcrypt, insert into users table, handle duplicate username error
- [ ] 7.2 Create `server/cli/import-translation.php`: accept JSON file path as CLI arg, validate file, insert into translation_resources and translation_entries in a transaction
- [ ] 7.3 Create `server/cli/import-tafsir.php`: accept JSON file path as CLI arg, validate file, insert into tafsir_resources and tafsir_entries in a transaction

## Task 8: Error Handling and CORS

- [ ] 8.1 Configure Slim error middleware in `index.php` to return JSON error responses with `Content-Type: application/json` for all unhandled exceptions
- [ ] 8.2 Add a custom error handler that logs exceptions to `server/logs/error.log` and returns `{ "error": "Internal server error" }` with HTTP 500
- [ ] 8.3 Ensure CorsMiddleware handles OPTIONS preflight requests correctly
