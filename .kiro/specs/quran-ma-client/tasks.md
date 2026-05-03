# Tasks — Quran Ma Phase 1: Application Foundation and Skeleton

## Task 1: SvelteKit Project Setup

- [x] 1.1 Initialize SvelteKit 2 project with Svelte 5 in `client/` directory using `npm create svelte@latest`, selecting skeleton project with TypeScript
- [x] 1.2 Install and configure @sveltejs/adapter-static with SPA fallback (`fallback: 'index.html'`, `prerender: { entries: [] }`)
- [x] 1.3 Install and configure Tailwind CSS v4 (`@tailwindcss/vite` plugin, `app.css` with `@import "tailwindcss"`)
- [x] 1.4 Download and add Vazirmatn font files to `static/fonts/Vazirmatn/`, add @font-face declarations in `app.css`
- [x] 1.5 Install Capacitor core (`@capacitor/core`, `@capacitor/cli`) and create `capacitor.config.ts` pointing webDir to `build`
- [x] 1.6 Install @capacitor-community/electron and initialize the Electron project in `client/electron/`
- [x] 1.7 Configure Electron window title to "Quran Ma — قرآن ما" in the Electron config
- [x] 1.8 Verify the project builds successfully with `npm run build` producing static output in `build/`

## Task 2: shadcn-rtl Component Integration

- [x] 2.1 Clone/download shadcn-rtl components from https://github.com/afzali/shadcn-rtl and copy the UI components into `src/lib/components/ui-rtl/`
- [x] 2.2 Copy the RtlProvider component, cnRtl utility, and rtl-context.svelte.ts into the appropriate locations (`$lib/utils/` for utilities, `$lib/components/ui-rtl/` for RtlProvider)
- [x] 2.3 Install shadcn-rtl peer dependencies (tailwind-merge, clsx, class-variance-authority, paneforge, etc.)
- [x] 2.4 Verify RtlProvider renders correctly by wrapping a test component and toggling direction

## Task 3: Three-Panel Layout

- [x] 3.1 Create `AppShell.svelte` in `src/lib/components/shared/` using paneforge PaneGroup with three Panes (Analysis left, QuranDisplay center, Navigation right)
- [x] 3.2 Configure Analysis and Navigation panes as collapsible with `collapsible` and `collapsedSize={0}`, set `autoSaveId="quran-ma-layout"` on PaneGroup
- [x] 3.3 Create `AnalysisPlaceholder.svelte` showing a localized placeholder message for the Analysis Panel
- [x] 3.4 Create `ui-context.svelte.ts` in `src/lib/state/` with reactive state for navBarVisible, analysisPanelVisible, and isMobile
- [x] 3.5 Create `MobileOverlay.svelte` in `src/lib/components/shared/` that renders side panels as overlays when viewport < 768px
- [x] 3.6 Wire up `+page.svelte` to render AppShell as the main page content
- [x] 3.7 Add RTL-aware CSS so that in RTL mode the panel visual order is Navigation (right) → Quran (center) → Analysis (left)

## Task 4: Internationalization (i18n)

- [x] 4.1 Create `src/lib/i18n/fa.ts` with Persian translation strings for all Phase 1 UI labels (app title, nav labels, Surah metadata labels, placeholder messages)
- [x] 4.2 Create `src/lib/i18n/en.ts` with English translation strings matching all keys in fa.ts
- [x] 4.3 Create `src/lib/i18n/index.ts` with `t(key)` translation function that reads current locale from i18n-context
- [x] 4.4 Create `src/lib/state/i18n-context.svelte.ts` with reactive locale ($state) and derived direction, plus getLocale/setLocale/getDirection functions
- [x] 4.5 Create `LanguageSwitcher.svelte` component in `src/lib/components/navigation/` that toggles between 'fa' and 'en' locales
- [x] 4.6 Wire RtlProvider in `+layout.svelte` to read direction from i18n-context and apply it globally
- [x] 4.7 Verify language switching updates all UI text and layout direction without page reload

## Task 5: SQLite Database Setup

- [x] 5.1 Install @capacitor-community/sqlite and its dependencies
- [x] 5.2 Create `src/lib/data/database-adapter.ts` defining the `DatabaseAdapter` interface with methods: `execute(sql, params)`, `query(sql, params)`, `run(sql, params)`, `transaction(fn)`, `open()`, `close()`
- [x] 5.3 Create `src/lib/data/adapters/capacitor-sqlite-adapter.ts` implementing `DatabaseAdapter` using @capacitor-community/sqlite (works for both Electron/better-sqlite3 and Android native)
- [x] 5.4 Create `src/lib/data/adapters/index.ts` with `createAdapter()` factory function that selects the appropriate adapter based on `Capacitor.getPlatform()` — Capacitor adapter for 'electron' and 'android', with a placeholder for future 'web' adapter
- [x] 5.5 Create `src/lib/data/database.ts` with `initDatabase()` and `getDb()` functions that use the adapter factory, not direct Capacitor SQLite calls
- [x] 5.6 Create `src/lib/data/migrations/001-initial.sql` with CREATE TABLE statements for SURAH, VERSE, WORD, and APP_SETTINGS tables including indexes
- [x] 5.7 Create `src/lib/data/migrations/index.ts` with migration runner that checks db_version and applies pending migrations
- [x] 5.8 Create `src/lib/data/repositories/settings-repository.ts` with getSetting, setSetting, getLastSelection, saveLastSelection functions — using only `DatabaseAdapter` interface
- [x] 5.9 Create `src/lib/data/repositories/quran-repository.ts` with getSurahList, getSurahVerses, getVerse functions — using only `DatabaseAdapter` interface
- [x] 5.10 Create Quran data seed file (`src/lib/data/seed/quran-data.json` or SQL) with all 114 Surah metadata and integrate seeding into the migration/init process
- [x] 5.11 Add `sql-wasm.wasm` to `static/assets/` for web/dev mode SQLite support via jeep-sqlite
- [x] 5.12 Wire database initialization into `+layout.svelte` onMount, showing a loading screen until ready

## Task 6: Table of Contents

- [x] 6.1 Create `SurahListItem.svelte` in `src/lib/components/navigation/` displaying Surah number, Arabic name, transliterated name, and verse count
- [x] 6.2 Create `TableOfContents.svelte` in `src/lib/components/navigation/` that fetches Surah list from quran-repository and renders a scrollable list of SurahListItem components
- [x] 6.3 Create `NavigationBar.svelte` in `src/lib/components/navigation/` containing the TableOfContents and LanguageSwitcher
- [x] 6.4 Wire SurahListItem click to call selectSurah() from selection-context, updating the active Selection
- [x] 6.5 Add visual highlight (active state styling) to the SurahListItem that matches the current Selection's surahNumber

## Task 7: Quran Text Display

- [x] 7.1 Create `src/lib/utils/quran-utils.ts` with helper functions: `toArabicIndic(n: number)` for numeral conversion, `verseKey(surah, verse)` for formatting, `shouldShowBismillah(surahNumber)` returning true for all except Surah 9
- [x] 7.2 Create `SurahHeader.svelte` in `src/lib/components/quran/` displaying Surah name (Arabic), number, verse count, and revelation type
- [x] 7.3 Create `Bismillah.svelte` in `src/lib/components/quran/` rendering the Bismillah text with proper Arabic typography
- [x] 7.4 Create `VerseItem.svelte` in `src/lib/components/quran/` rendering a single verse with Arabic text (RTL), Arabic-Indic verse number in a decorative marker, and click handler for selection
- [x] 7.5 Create `VerseList.svelte` in `src/lib/components/quran/` that receives a list of verses and renders VerseItem components, highlighting the selected verse
- [x] 7.6 Create `QuranDisplay.svelte` in `src/lib/components/quran/` that reads the current Selection from selection-context, fetches verses from quran-repository, and renders SurahHeader + Bismillah (conditionally) + VerseList
- [x] 7.7 Create `src/lib/services/quran-service.ts` with functions to load Surah data and verses, acting as the service layer between components and repositories

## Task 8: Selection Context

- [x] 8.1 Create `src/lib/state/selection-context.svelte.ts` with Selection type, $state for current selection, selectSurah(), selectVerse(), getSelection(), isVerseLevelSelection() functions
- [x] 8.2 Add restoreSelection() function that reads last_selection_surah and last_selection_verse from settings-repository on app startup
- [x] 8.3 Add persistSelection() function that saves current selection to APP_SETTINGS via settings-repository whenever selection changes
- [x] 8.4 Wire selection restoration into `+layout.svelte` initialization flow (after database init, before rendering)
- [x] 8.5 Verify that selecting a Surah from TOC updates QuranDisplay, and clicking a verse highlights it and updates the Selection

## Task 9: Capacitor Electron Build and HMR

- [x] 9.1 Configure Capacitor Electron project with correct webDir path pointing to the SvelteKit build output
- [x] 9.2 Add development mode configuration to `capacitor.config.ts` that points Electron webview to `http://localhost:5173` when `process.env.NODE_ENV === 'development'`
- [x] 9.3 Create a `dev:electron` npm script that starts the Vite dev server and then launches Electron pointing to it, enabling HMR for live code changes
- [x] 9.4 Verify @capacitor-community/sqlite works in Electron context (better-sqlite3 backend) by running a test query
- [x] 9.5 Build and launch the app as a Windows desktop application using `npx cap sync electron && npx cap open electron`
- [x] 9.6 Verify the full flow: app launches → database initializes → TOC loads 114 Surahs → selecting a Surah renders verses → clicking a verse highlights it
- [x] 9.7 Verify HMR: change a component while Electron is running → change reflects automatically without full restart

## Task 10: SvelteKit Routing Structure

- [x] 10.1 Set up SvelteKit route structure with layout groups: `(app)/` for the main Quran workspace and `(auth)/` for login/registration pages (placeholder in Phase 1)
- [x] 10.2 Create `(app)/+layout.svelte` that renders the three-panel AppShell and initializes app-level state
- [x] 10.3 Create route `(app)/surah/[surahNumber]/+page.svelte` that reads the surahNumber param and sets the Selection accordingly
- [x] 10.4 Create route `(app)/surah/[surahNumber]/verse/[verseNumber]/+page.svelte` that reads both params and sets Selection to the specific verse
- [x] 10.5 Update TableOfContents and VerseItem navigation to use `goto()` with the URL path (e.g., `/surah/2`) instead of only state changes, so the URL stays in sync
- [x] 10.6 Create `(auth)/+layout.svelte` as a minimal layout without the three-panel shell (placeholder for Phase 4 login page)
- [x] 10.7 Add a layout-level auth guard hook in `(app)/+layout.ts` that can be activated in Phase 4 — for now it passes through without checking auth
- [x] 10.8 Verify deep linking: navigating to `/surah/2` loads Surah Al-Baqarah directly, and `/surah/1/verse/3` selects verse 3 of Al-Fatiha
