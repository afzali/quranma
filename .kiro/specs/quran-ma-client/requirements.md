# Requirements Document — Quran Ma (قرآن ما) Phase 1: Application Foundation and Skeleton

## Introduction

This document covers Phase 1 of the Quran Ma (قرآن ما) client application — the foundational skeleton that establishes the project structure, core layout, basic Quran reading experience, and desktop deployment pipeline.

Phase 1 delivers a working Windows desktop application where a user can browse the list of 114 Surahs, read Quran text with proper Arabic typography, and switch between Persian and English UI. It does not include courses, bookmarks, search, analysis tabs, authentication, sync, or Android deployment — those are deferred to later phases.

## Glossary

- **App**: The Quran Ma client application (SvelteKit + Capacitor)
- **User**: A person interacting with the App
- **Surah**: A chapter of the Quran (114 total)
- **Verse** (Ayah): A single verse within a Surah
- **Selection**: The currently active Surah or Verse that drives what content is displayed in the UI panels
- **Navigation_Bar**: The right-side panel providing access to the Table of Contents
- **Quran_Display**: The center panel that renders Quran text based on the current Selection
- **Analysis_Panel**: The left-side panel (empty placeholder in Phase 1)
- **Local_Database**: The SQLite database stored on the user's device via @capacitor-community/sqlite
- **I18n_Engine**: The internationalization subsystem responsible for bilingual UI rendering and RTL/LTR layout switching
- **Three_Panel_Layout**: The main application layout consisting of Navigation_Bar (right), Quran_Display (center), and Analysis_Panel (left), built with paneforge
- **DatabaseAdapter**: An interface abstracting SQLite operations, allowing different implementations (Capacitor plugin, wa-sqlite, sql.js) to be swapped without changing business logic
- **HMR**: Hot Module Replacement — a development feature where code changes are reflected in the running app without a full restart
- **Route_Group**: A SvelteKit routing concept using parenthesized folder names (e.g., `(app)`, `(auth)`) to share layouts without affecting the URL path
- **Auth_Guard**: A layout-level mechanism that checks authentication status and redirects unauthenticated users to the login page when required

---

## Requirements

### Requirement 1: SvelteKit Project Setup with Capacitor

**User Story:** As a developer, I want a properly configured SvelteKit project with Capacitor and Electron integration, so that the application can be built and run as a Windows desktop app.

#### Acceptance Criteria

1. THE App SHALL be a SvelteKit 2 project using Svelte 5 with runes mode enabled
2. THE App SHALL use @sveltejs/adapter-static configured for SPA mode with fallback to index.html
3. THE App SHALL integrate Capacitor with @capacitor-community/electron for Windows desktop deployment
4. THE App SHALL use Tailwind CSS v4 for styling
5. THE App SHALL include the Vazirmatn font for Persian text rendering
6. WHEN the App is built, THE build process SHALL produce a static SPA bundle that Capacitor can wrap as a desktop application

---

### Requirement 2: shadcn-rtl Component Integration

**User Story:** As a developer, I want RTL-ready UI components available in the project, so that the interface supports bidirectional layouts correctly.

#### Acceptance Criteria

1. THE App SHALL include shadcn-rtl components copied into the project's component directory
2. THE App SHALL include the RtlProvider component from shadcn-rtl for managing RTL/LTR context
3. THE App SHALL include the cnRtl utility from shadcn-rtl for automatic Tailwind class direction conversion
4. THE App SHALL include the rtl-context module from shadcn-rtl for reactive direction state management using Svelte 5 runes

---

### Requirement 3: Three-Panel Layout

**User Story:** As a user, I want the application to present a three-panel layout, so that I can navigate and read the Quran in an organized workspace.

#### Acceptance Criteria

1. THE App SHALL render a Three_Panel_Layout using paneforge with the Navigation_Bar on the right, the Quran_Display in the center, and the Analysis_Panel on the left
2. THE App SHALL make the Navigation_Bar and Analysis_Panel resizable using paneforge PaneResizer components
3. THE App SHALL make the Navigation_Bar and Analysis_Panel collapsible using paneforge's collapsible pane feature
4. THE App SHALL persist panel sizes across sessions using paneforge's autoSaveId feature
5. WHEN the viewport width is below 768px, THE App SHALL collapse the Navigation_Bar and Analysis_Panel into toggleable overlays while keeping the Quran_Display always visible
6. THE Analysis_Panel SHALL display a placeholder message in Phase 1 indicating that analysis features are coming in a future update

---

### Requirement 4: Internationalization and Bidirectional Layout

**User Story:** As a user, I want to switch between Persian and English interfaces, so that I can use the application in my preferred language.

#### Acceptance Criteria

1. THE I18n_Engine SHALL support two UI languages: Persian (fa) and English (en)
2. WHEN the User selects Persian as the UI language, THE App SHALL render the entire interface in right-to-left (RTL) layout direction
3. WHEN the User selects English as the UI language, THE App SHALL render the entire interface in left-to-right (LTR) layout direction
4. THE App SHALL persist the selected UI language in the Local_Database APP_SETTINGS table and restore it on next launch
5. WHEN the UI language is changed, THE App SHALL apply the new language and layout direction without requiring an application restart
6. THE I18n_Engine SHALL provide a translation function that returns localized strings for all UI labels, buttons, and messages

---

### Requirement 5: SQLite Database Setup

**User Story:** As a developer, I want a local SQLite database initialized with the core schema, so that the application can store and retrieve Quran data and settings.

#### Acceptance Criteria

1. THE App SHALL initialize a SQLite database using @capacitor-community/sqlite on application startup
2. THE App SHALL run database migrations on startup to create or update the schema to the latest version
3. THE Local_Database SHALL contain a SURAH table storing: number (primary key), name_arabic, name_transliteration, verse_count, and revelation_type for all 114 Surahs
4. THE Local_Database SHALL contain a VERSE table storing: id (primary key), surah_number (foreign key), verse_number, text_arabic, and text_simple
5. THE Local_Database SHALL contain a WORD table storing: id (primary key), surah_number (foreign key), verse_number (foreign key), position, text_arabic, root, meaning_default, and derivatives
6. THE Local_Database SHALL contain an APP_SETTINGS table storing key-value pairs for application preferences including locale and last viewed Surah
7. THE App SHALL store the current database schema version in APP_SETTINGS and use it to determine which migrations to apply

---

### Requirement 6: Table of Contents

**User Story:** As a user, I want to browse the list of all 114 Surahs, so that I can navigate to any Surah quickly.

#### Acceptance Criteria

1. WHEN the App launches, THE Navigation_Bar SHALL display a scrollable list of all 114 Surahs
2. THE Table of Contents SHALL display for each Surah: the Surah number, the Arabic name, the transliterated name, and the verse count
3. WHEN the User selects a Surah from the Table of Contents, THE App SHALL set the Selection to the selected Surah and THE Quran_Display SHALL render the verses of that Surah
4. THE Table of Contents SHALL visually indicate which Surah is currently selected
5. THE App SHALL display Surah names in Arabic script regardless of the active UI language

---

### Requirement 7: Quran Text Display

**User Story:** As a user, I want to read the Quran text with proper Arabic typography, so that I can study the text effectively.

#### Acceptance Criteria

1. WHEN a Surah is selected, THE Quran_Display SHALL render all verses of the selected Surah in Arabic script using a Quran-appropriate font
2. THE Quran_Display SHALL display verse numbers alongside each verse using Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) enclosed in a decorative verse marker
3. THE Quran_Display SHALL render the Bismillah (بسم الله الرحمن الرحیم) at the top of each Surah except Surah At-Tawbah (Surah 9)
4. THE Quran_Display SHALL use right-to-left text direction for all Arabic Quran text regardless of the active UI language
5. THE Quran_Display SHALL display a Surah header showing the Surah name, number, verse count, and revelation type above the verses
6. WHEN the User clicks on a verse, THE App SHALL set the Selection to that verse and THE Quran_Display SHALL visually highlight the selected verse

---

### Requirement 8: Selection Context

**User Story:** As a user, I want the application to always have an active selection context, so that the UI always shows relevant content.

#### Acceptance Criteria

1. WHEN the App launches, THE App SHALL set the Selection to the last viewed Surah from the previous session stored in APP_SETTINGS, or to Surah Al-Fatiha (Surah 1) if no previous session data exists
2. THE App SHALL maintain a Selection at all times — either a Surah-level selection or a specific Verse within a Surah
3. WHEN the User navigates to a Surah without selecting a specific verse, THE App SHALL set the Selection to the Surah level
4. WHEN the Selection changes, THE App SHALL persist the current Selection (Surah number and optional verse number) in the APP_SETTINGS table of the Local_Database
5. WHEN a verse is selected, THE Quran_Display SHALL visually distinguish the selected verse from other verses

---

### Requirement 9: Hot Module Replacement in Desktop Development

**User Story:** As a developer, I want code changes to automatically reflect in the running Electron desktop app during development, so that I can iterate quickly without manual rebuilds.

#### Acceptance Criteria

1. WHEN the developer runs the development server (`npm run dev`), THE Electron app SHALL load the SvelteKit dev server URL instead of the static build output
2. WHEN a source file is modified during development, THE Electron app SHALL reflect the change automatically via Vite's HMR without requiring a full app restart
3. THE capacitor.config.ts SHALL support a development mode configuration that points the Electron webview to the local dev server URL (e.g., `http://localhost:5173`)
4. THE production build SHALL continue to use the static build output from `adapter-static`

---

### Requirement 10: SQLite Database Adapter Pattern

**User Story:** As a developer, I want the database access layer abstracted behind an adapter interface, so that I can swap the SQLite implementation (Capacitor plugin, wa-sqlite for browser, or others) without changing business logic.

#### Acceptance Criteria

1. THE Data Access Layer SHALL define a `DatabaseAdapter` interface with methods for executing SQL queries, running transactions, and managing connections
2. THE App SHALL provide a Capacitor SQLite adapter that implements the `DatabaseAdapter` interface using @capacitor-community/sqlite
3. THE App SHALL select the appropriate adapter at initialization time based on the runtime platform (Capacitor native, Electron, or web browser)
4. ALL repository modules SHALL depend only on the `DatabaseAdapter` interface, not on any specific SQLite implementation
5. THE `DatabaseAdapter` interface SHALL support a future web adapter (e.g., wa-sqlite or sql.js running in the browser) without requiring changes to repositories or services

---

### Requirement 11: SvelteKit Routing Structure

**User Story:** As a developer, I want a proper SvelteKit routing structure with layout groups, so that the app can support authenticated routes, public routes, and future web deployment.

#### Acceptance Criteria

1. THE App SHALL use SvelteKit's file-based routing with a root layout (`+layout.svelte`) that initializes the database, i18n, and global state
2. THE App SHALL organize routes into layout groups: a main app group (containing the three-panel Quran workspace) and an auth group (containing login and registration pages)
3. THE App SHALL support a route-based navigation model where the current Surah and verse can be represented in the URL path (e.g., `/surah/1` or `/surah/1/verse/5`) for future web compatibility
4. THE App SHALL provide a layout-level auth guard mechanism that can be activated in Phase 4 to redirect unauthenticated users to the login page when required
5. WHEN running inside Capacitor (desktop or mobile), THE App SHALL use SvelteKit's client-side routing without server-side rendering
6. THE routing structure SHALL support deep linking so that navigating to a URL like `/surah/2` loads Surah Al-Baqarah directly

---

### Requirement 12: Windows Desktop Build

**User Story:** As a user, I want to run the application as a Windows desktop app, so that I can use it natively on my computer.

#### Acceptance Criteria

1. THE App SHALL be buildable as a Windows desktop application using Capacitor with @capacitor-community/electron
2. WHEN the App runs as a Windows desktop application, THE App SHALL have access to the Local_Database through @capacitor-community/sqlite's Electron implementation (better-sqlite3)
3. THE App SHALL display a proper application window title showing "Quran Ma — قرآن ما"
4. WHEN the App is launched on Windows, THE App SHALL load the SPA from the static build output and initialize the database before rendering the UI
