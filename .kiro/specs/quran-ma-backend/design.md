# Design Document — Quran Ma PHP Backend

## Overview

The Quran Ma PHP backend is a REST API built with the Slim Framework on PHP 8.1+. It serves three concerns: JWT-based authentication, course-scoped data synchronization with conflict detection, and static resource hosting for Quran translations and tafsirs. The backend uses MySQL/MariaDB for persistence, Composer for dependency management, and `.env` files for configuration.

### Key Design Decisions

1. **Slim Framework**: Lightweight micro-framework providing PSR-7 HTTP handling, routing, and middleware without the overhead of Laravel or Symfony.

2. **firebase/php-jwt for tokens**: Minimal JWT library. No OAuth complexity — simple username/password auth with long-lived tokens.

3. **vlucas/phpdotenv for configuration**: Standard `.env` loading. Keeps secrets out of code.

4. **PDO for database access**: Native PHP database abstraction. No ORM — queries are straightforward CRUD. Prepared statements prevent SQL injection.

5. **sync_version conflict detection**: The server increments sync_version on every write. On update, if the client's version doesn't match, the server returns 409 with current data. The client resolves conflicts and can force-push.

6. **Table name whitelist**: The sync endpoint validates `table_name` against a hardcoded whitelist of the 12 syncable tables to prevent SQL injection.

7. **Stateless auth**: JWT tokens carry all auth info. Logout is a client-side operation (delete stored token). No server-side session state.

## Architecture

```
server/
├── public/
│   └── index.php              # Entry point — bootstraps Slim app
├── src/
│   ├── Middleware/
│   │   ├── AuthMiddleware.php  # JWT verification for protected routes
│   │   ├── CorsMiddleware.php  # CORS headers for all responses
│   │   └── JsonBodyParser.php  # Parse JSON request bodies
│   ├── Handlers/
│   │   ├── AuthHandler.php     # Login/logout endpoints
│   │   ├── SyncHandler.php     # Push/pull endpoints
│   │   └── ResourceHandler.php # Translation/tafsir listing + download
│   ├── Services/
│   │   ├── AuthService.php     # Password verification, JWT generation
│   │   ├── SyncService.php     # Sync logic, conflict detection
│   │   └── ResourceService.php # Resource queries
│   ├── Database/
│   │   └── Connection.php      # PDO singleton factory
│   └── Config.php              # Environment variable access
├── migrations/
│   └── 001-schema.sql          # Full database schema
├── cli/
│   ├── create-user.php         # Admin: create user accounts
│   ├── import-translation.php  # Admin: import translation JSON
│   ├── import-tafsir.php       # Admin: import tafsir JSON
│   └── migrate.php             # Run database migrations
├── composer.json
├── .env.example
└── .htaccess
```

### Request Flow

```
HTTP Request
    │
    ▼
public/index.php (Slim App bootstrap)
    │
    ▼
CorsMiddleware → JsonBodyParser → [AuthMiddleware] → Handler → Service → PDO
    │
    ▼
JSON Response
```

## Components and Interfaces

### Entry Point — public/index.php

```php
<?php
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use App\Middleware\{CorsMiddleware, JsonBodyParser, AuthMiddleware};
use App\Handlers\{AuthHandler, SyncHandler, ResourceHandler};

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();
$dotenv->required(['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'JWT_SECRET']);

$app = AppFactory::create();
$app->add(new CorsMiddleware());
$app->add(new JsonBodyParser());
$app->addErrorMiddleware(($_ENV['APP_DEBUG'] ?? 'false') === 'true', true, true);

// Public routes
$app->post('/api/auth/login', [AuthHandler::class, 'login']);
$app->get('/api/resources/translations', [ResourceHandler::class, 'listTranslations']);
$app->get('/api/resources/tafsirs', [ResourceHandler::class, 'listTafsirs']);
$app->get('/api/resources/translations/{id}/download', [ResourceHandler::class, 'downloadTranslation']);
$app->get('/api/resources/tafsirs/{id}/download', [ResourceHandler::class, 'downloadTafsir']);

// Protected routes
$auth = new AuthMiddleware();
$app->post('/api/auth/logout', [AuthHandler::class, 'logout'])->add($auth);
$app->post('/api/sync/push', [SyncHandler::class, 'push'])->add($auth);
$app->get('/api/sync/pull', [SyncHandler::class, 'pull'])->add($auth);

// CORS preflight
$app->options('/{routes:.+}', fn($req, $res) => $res);

$app->run();
```

### AuthMiddleware.php

```php
<?php
namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware
{
    public function __invoke(Request $request, Handler $handler): Response
    {
        $header = $request->getHeaderLine('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return $this->unauthorized();
        }
        try {
            $decoded = JWT::decode(substr($header, 7), new Key($_ENV['JWT_SECRET'], 'HS256'));
            $request = $request->withAttribute('user_id', $decoded->sub);
            $request = $request->withAttribute('username', $decoded->username);
            return $handler->handle($request);
        } catch (\Exception $e) {
            return $this->unauthorized();
        }
    }

    private function unauthorized(): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }
}
```

### AuthService.php

```php
<?php
namespace App\Services;

use App\Database\Connection;
use Firebase\JWT\JWT;

class AuthService
{
    public function login(string $username, string $password): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return null;
        }

        $token = JWT::encode([
            'sub' => $user['id'],
            'username' => $user['username'],
            'iat' => time(),
            'exp' => time() + (30 * 24 * 60 * 60),
        ], $_ENV['JWT_SECRET'], 'HS256');

        return ['token' => $token, 'username' => $user['username']];
    }
}
```

### SyncService.php — Core Sync Logic

```php
<?php
namespace App\Services;

use App\Database\Connection;

class SyncService
{
    private const SYNCABLE_TABLES = [
        'bookmarks', 'topics', 'topic_verses', 'user_word_data',
        'user_translations', 'user_tafsirs', 'siyaq_groups', 'siyaq_verses',
        'nazm_kavi_items', 'nazm_kavi_verses', 'shabake_kavi_connections',
        'eqameh_entries',
    ];

    public function verifyCourseOwnership(int $courseId, int $userId): bool
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?');
        $stmt->execute([$courseId, $userId]);
        return $stmt->fetch() !== false;
    }

    public function push(string $table, int $recordId, string $op, int $courseId, int $userId, ?array $payload, bool $force): array
    {
        if ($op === 'insert') return $this->handleInsert($table, $courseId, $userId, $payload);
        if ($op === 'update') return $this->handleUpdate($table, $recordId, $courseId, $userId, $payload, $force);
        if ($op === 'delete') return $this->handleDelete($table, $recordId, $courseId, $userId);
        return ['status' => 400, 'body' => ['error' => 'Invalid operation']];
    }

    private function handleInsert(string $table, int $courseId, int $userId, ?array $payload): array
    {
        $pdo = Connection::get();
        $payload['user_id'] = $userId;
        $payload['course_id'] = $courseId;
        $payload['sync_version'] = 1;

        $columns = implode(', ', array_keys($payload));
        $placeholders = implode(', ', array_fill(0, count($payload), '?'));

        $stmt = $pdo->prepare("INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})");
        $stmt->execute(array_values($payload));

        return ['status' => 200, 'body' => ['ok' => true, 'sync_version' => 1]];
    }

    private function handleUpdate(string $table, int $recordId, int $courseId, int $userId, ?array $payload, bool $force): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ? AND course_id = ? AND user_id = ?");
        $stmt->execute([$recordId, $courseId, $userId]);
        $current = $stmt->fetch();

        if (!$current) {
            return ['status' => 404, 'body' => ['error' => 'Record not found']];
        }

        if (!$force && isset($payload['sync_version']) && $current['sync_version'] !== $payload['sync_version']) {
            return ['status' => 409, 'body' => [
                'conflict' => true,
                'remote_data' => $current,
                'remote_sync_version' => $current['sync_version'],
            ]];
        }

        $newVersion = $current['sync_version'] + 1;
        $payload['sync_version'] = $newVersion;
        unset($payload['user_id'], $payload['course_id'], $payload['id']);

        $sets = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($payload)));
        $stmt = $pdo->prepare("UPDATE {$table} SET {$sets} WHERE id = ? AND course_id = ? AND user_id = ?");
        $stmt->execute([...array_values($payload), $recordId, $courseId, $userId]);

        return ['status' => 200, 'body' => ['ok' => true, 'sync_version' => $newVersion]];
    }

    private function handleDelete(string $table, int $recordId, int $courseId, int $userId): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare("DELETE FROM {$table} WHERE id = ? AND course_id = ? AND user_id = ?");
        $stmt->execute([$recordId, $courseId, $userId]);
        return ['status' => 200, 'body' => ['ok' => true, 'sync_version' => 0]];
    }

    public function pull(int $courseId, int $userId): array
    {
        $pdo = Connection::get();
        $result = [];
        foreach (self::SYNCABLE_TABLES as $table) {
            $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE course_id = ? AND user_id = ?");
            $stmt->execute([$courseId, $userId]);
            $result[$table] = $stmt->fetchAll();
        }
        return $result;
    }
}
```

### ResourceService.php

```php
<?php
namespace App\Services;

use App\Database\Connection;

class ResourceService
{
    public function getTranslations(): array
    {
        $pdo = Connection::get();
        $rows = $pdo->query('SELECT id, name, language, translator FROM translation_resources')->fetchAll();
        return array_map(fn($r) => [
            ...$r,
            'download_url' => "/api/resources/translations/{$r['id']}/download",
        ], $rows);
    }

    public function getTafsirs(): array
    {
        $pdo = Connection::get();
        $rows = $pdo->query('SELECT id, name, author FROM tafsir_resources')->fetchAll();
        return array_map(fn($r) => [
            ...$r,
            'download_url' => "/api/resources/tafsirs/{$r['id']}/download",
        ], $rows);
    }

    public function getTranslationEntries(int $id): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id FROM translation_resources WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) return null;

        $stmt = $pdo->prepare('SELECT surah_number, verse_number, text_content FROM translation_entries WHERE resource_id = ? ORDER BY surah_number, verse_number');
        $stmt->execute([$id]);
        return $stmt->fetchAll();
    }

    public function getTafsirEntries(int $id): ?array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id FROM tafsir_resources WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) return null;

        $stmt = $pdo->prepare('SELECT surah_number, verse_number, text_content FROM tafsir_entries WHERE resource_id = ? ORDER BY surah_number, verse_number');
        $stmt->execute([$id]);
        return $stmt->fetchAll();
    }
}
```

### Database/Connection.php

```php
<?php
namespace App\Database;

class Connection
{
    private static ?\PDO $instance = null;

    public static function get(): \PDO
    {
        if (self::$instance === null) {
            self::$instance = new \PDO(
                sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                    $_ENV['DB_HOST'], $_ENV['DB_PORT'] ?? '3306', $_ENV['DB_NAME']),
                $_ENV['DB_USER'], $_ENV['DB_PASS'],
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                 \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                 \PDO::ATTR_EMULATE_PREPARES => false]
            );
        }
        return self::$instance;
    }
}
```

## Data Models

### Database Schema (migrations/001-schema.sql)

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12 syncable tables (all share user_id, course_id, sync_version pattern)
-- See full schema in migrations/001-schema.sql

CREATE TABLE translation_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    language VARCHAR(100) NOT NULL,
    translator VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE translation_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    surah_number INT NOT NULL,
    verse_number INT NOT NULL,
    text_content TEXT NOT NULL,
    FOREIGN KEY (resource_id) REFERENCES translation_resources(id) ON DELETE CASCADE,
    INDEX idx_trans_entries_resource (resource_id, surah_number, verse_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tafsir_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tafsir_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    surah_number INT NOT NULL,
    verse_number INT NOT NULL,
    text_content TEXT NOT NULL,
    FOREIGN KEY (resource_id) REFERENCES tafsir_resources(id) ON DELETE CASCADE,
    INDEX idx_tafsir_entries_resource (resource_id, surah_number, verse_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Correctness Properties

### Property 1: Auth Round-Trip
FOR ALL valid username/password pairs in the users table, calling POST /api/auth/login SHALL return a JWT token that, when decoded, contains the correct user id and username claims.

### Property 2: Sync Version Monotonicity
FOR ALL update operations on a Syncable_Table record, the sync_version SHALL strictly increase by 1 on each successful (non-conflict) update.

### Property 3: Conflict Detection Correctness
FOR ALL update operations where the payload's sync_version does not match the record's current sync_version and force is false, the Backend SHALL return HTTP 409 with the current record data.

### Property 4: Force Push Override
FOR ALL update operations where force is true, the Backend SHALL update the record regardless of sync_version mismatch and return HTTP 200.

### Property 5: Course Isolation
FOR ALL sync push and pull operations, the Backend SHALL only allow access to records where the course's user_id matches the authenticated user's id.

### Property 6: Resource Download Round-Trip
FOR ALL translation and tafsir resources, the entries returned by the download endpoint SHALL match exactly the entries stored in the database for that resource_id, ordered by surah_number then verse_number.

### Property 7: Table Name Validation
FOR ALL sync push requests with a table_name not in the whitelist of 12 Syncable_Tables, the Backend SHALL return HTTP 400 and perform no database mutation.
