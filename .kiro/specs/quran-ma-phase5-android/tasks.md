# Implementation Plan: Quran Ma Phase 5 — Android Build and Platform Polish

## Overview

This plan implements the Android build via Capacitor, verifies cross-platform plugin compatibility, optimizes the UI for touch and mobile, adds performance improvements (lazy loading, virtual scrolling), ensures accessibility, and polishes the Electron desktop experience. Tasks are ordered so each step builds on the previous, with no orphaned code.

## Tasks

- [ ] 1. Capacitor Android project initialization and configuration
  - [ ] 1.1 Install @capacitor/android, @capacitor/splash-screen, and @capacitor/status-bar dependencies
    - Run `npm install @capacitor/android @capacitor/splash-screen @capacitor/status-bar`
    - _Requirements: 1.1, 6.4_

  - [ ] 1.2 Update capacitor.config.ts with Android and splash screen configuration
    - Set `appId` to `com.quranma.app`, `appName` to `Quran Ma`, `webDir` to `build`
    - Add `server.androidScheme: 'https'`
    - Add `SplashScreen` plugin config: `launchShowDuration: 2000`, `launchAutoHide: false`, `backgroundColor: '#1a1a2e'`, `androidSplashResourceName: 'splash'`, `launchFadeOutDuration: 300`
    - Add `CapacitorSQLite` plugin config with `androidIsEncryption: false`
    - _Requirements: 1.4, 6.2, 6.4_

  - [ ] 1.3 Initialize the Android project and configure Gradle build files
    - Run `npx cap add android` to generate `client/android/`
    - Update `client/android/app/build.gradle`: set `minSdk 24`, `compileSdk 34`, `targetSdk 34`, `applicationId "com.quranma.app"`, `versionCode 1`, `versionName "1.0.0"`
    - Add signing config that reads `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` from environment variables
    - Enable `minifyEnabled true` with ProGuard for release builds
    - Add `proguard-rules.pro` file for custom ProGuard rules
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 1.4 Add Android app icon resources in all required densities
    - Create adaptive icon resources in `mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`
    - Create `ic_launcher.xml` and `ic_launcher_round.xml` adaptive icon definitions
    - _Requirements: 6.1_

  - [ ] 1.5 Add splash screen drawable and theme configuration
    - Create `client/android/app/src/main/res/drawable/splash.xml` with app logo on `#1a1a2e` background
    - Update `styles.xml` to set splash theme
    - Update `colors.xml` with app theme colors
    - _Requirements: 6.2, 6.5_

  - [ ] 1.6 Run Capacitor sync and verify the Android project builds
    - Build the SvelteKit static output
    - Run `npx cap sync android` and verify no errors
    - Run `./gradlew assembleDebug` in `client/android/` and verify APK is produced
    - _Requirements: 1.5, 7.1_

- [ ] 2. Checkpoint — Verify Android project initialization
  - Ensure the Android project syncs and builds a debug APK without errors, ask the user if questions arise.

- [ ] 3. Android platform integration (SQLite, Network, Splash, Status Bar)
  - [ ] 3.1 Add splash screen dismissal logic to the root layout
    - In `+layout.svelte`, import `SplashScreen` from `@capacitor/splash-screen` and `Capacitor` from `@capacitor/core`
    - After all init steps (database, i18n, selection restore, network, auth), call `SplashScreen.hide({ fadeOutDuration: 300 })` when on a native platform
    - _Requirements: 6.3_

  - [ ] 3.2 Create status bar configuration utility
    - Create `$lib/utils/status-bar.ts`
    - Implement `configureStatusBar()` that sets background color to `#1a1a2e` and style to `Style.Dark` on Android only
    - Call `configureStatusBar()` during app initialization in `+layout.svelte`
    - _Requirements: 6.5, 5.4_

  - [ ] 3.3 Verify SQLite plugin works on Android
    - Confirm that the existing database service uses the native Android SQLite backend when `Capacitor.getPlatform() === 'android'`
    - Verify all migrations (001–004) run successfully on Android
    - Verify read/write operations on all tables (SURAH, VERSE, WORD, APP_SETTINGS, COURSE, BOOKMARK, TOPIC, SYNC_QUEUE, and analysis tables)
    - Add error handling: if a migration fails, display an error message and prevent further DB operations
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.4 Verify Network plugin works on Android
    - Confirm that `@capacitor/network` detects WiFi, cellular, and disconnected states on Android
    - Verify that online/offline transitions update `Network_Status` state and trigger sync operations per Phase 4
    - Verify the `NetworkIndicator` component displays correct status on Android
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Checkpoint — Verify Android platform integration
  - Ensure splash screen, status bar, SQLite, and network detection all work correctly on Android, ask the user if questions arise.

- [ ] 5. Touch input optimization
  - [ ] 5.1 Add CSS touch target utility classes
    - Add `@media (pointer: coarse)` rules to `app.css` with `.touch-target` (min 44×44px, 8px padding) and `.touch-target-lg` (min 48×48px, 12px padding)
    - _Requirements: 4.1_

  - [ ] 5.2 Apply touch-target class to all interactive elements
    - Add `touch-target` class to buttons, links, list items, tab triggers, and other interactive elements across all components
    - Ensure no hover-only UI states exist — all interactive states must be accessible via tap
    - Add touch feedback (ripple or highlight) CSS for interactive elements on Android
    - _Requirements: 4.1, 4.4, 4.5_

  - [ ] 5.3 Create swipe gesture Svelte action
    - Create `$lib/utils/swipe-gesture.ts` implementing the `swipeGesture` Svelte action
    - Accept `onSwipeLeft`, `onSwipeRight`, and `threshold` (default 50px) options
    - Only trigger when horizontal displacement exceeds vertical displacement and exceeds threshold
    - Use passive touch event listeners
    - _Requirements: 4.2_

  - [ ]* 5.4 Write property test for swipe gesture directionality
    - **Property 3: Swipe Gesture Directionality**
    - Test that rightward swipes trigger `onSwipeRight`, leftward swipes trigger `onSwipeLeft`
    - Test that diagonal or short swipes do not trigger either callback
    - **Validates: Requirements 4.2**

  - [ ] 5.5 Integrate swipe gestures into MobileOverlay
    - Apply `use:swipeGesture` to the MobileOverlay component
    - Swipe right opens navigation panel, swipe left opens analysis panel
    - Ensure verse tap selection works identically to desktop click on Android
    - _Requirements: 4.2, 4.3_

  - [ ]* 5.6 Write property test for touch target minimum size
    - **Property 6: Touch Target Minimum Size**
    - Verify all interactive elements render at minimum 44×44 CSS pixels on touch devices
    - **Validates: Requirements 4.1**

- [ ] 6. Responsive layout and safe area handling
  - [ ] 6.1 Add safe area CSS variables and viewport meta tag
    - Add CSS custom properties for `env(safe-area-inset-*)` to `:root` in `app.css`
    - Apply safe area padding to `.app-shell`
    - Update `app.html` meta viewport to include `viewport-fit=cover`
    - _Requirements: 5.4_

  - [ ] 6.2 Verify responsive layout on Android
    - Confirm Three_Panel_Layout collapses to single-panel view below 768px with Mobile_Overlay for navigation and analysis
    - Verify Mobile_Overlay opens, closes, and scrolls correctly on Android
    - Verify Quran Display fills available width without horizontal scrolling
    - Verify layout re-renders correctly on device rotation without losing selection state
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 7. Checkpoint — Verify touch and layout on Android
  - Ensure touch targets, swipe gestures, safe areas, and responsive layout all work correctly on Android, ask the user if questions arise.

- [ ] 8. Performance optimization — lazy loading and virtual scrolling
  - [ ] 8.1 Install @tanstack/svelte-virtual dependency
    - Run `npm install @tanstack/svelte-virtual`
    - _Requirements: 8.2_

  - [ ] 8.2 Implement lazy loading for Analysis Tabs
    - Refactor `AnalysisTabs.svelte` to use dynamic imports for each tab component (WordDataTab, TranslationTab, TafsirTab, SiyaqTab, NazmKaviTab, ShabakeKaviTab, EqamehTab)
    - Track loaded tabs in a `Set` to avoid re-importing
    - Only render a tab's content when it has been visited at least once
    - _Requirements: 8.1, 8.5_

  - [ ]* 8.3 Write property test for lazy loading idempotence
    - **Property 2: Lazy Loading Idempotence**
    - Test that loading a tab, switching away, and switching back produces the same state
    - Test that loading a tab multiple times does not create duplicate instances
    - **Validates: Requirements 8.1**

  - [ ] 8.4 Implement virtual scrolling for verse lists
    - Update `VerseList.svelte` to use `@tanstack/svelte-virtual` `createVirtualizer`
    - Apply virtual scrolling only for Surahs with more than 50 verses
    - Set `estimateSize` to 80px and `overscan` to 10
    - Render non-virtual list for Surahs with 50 or fewer verses
    - _Requirements: 8.2_

  - [ ]* 8.5 Write property test for virtual scrolling completeness
    - **Property 1: Virtual Scrolling Completeness**
    - Test that total accessible verses through virtual list equals the Surah's verse count
    - Test that scrolling to the end renders the last verse
    - **Validates: Requirements 8.2**

  - [ ] 8.6 Add fetch cancellation for Surah switching
    - When the user switches Surahs, cancel any in-progress data fetches for the previous Surah using `AbortController`
    - Ensure new fetches start cleanly without stale data
    - _Requirements: 8.4_

  - [ ] 8.7 Verify indexed SQLite queries for performance
    - Confirm all verse lookups, search operations, and bookmark queries use indexed columns
    - Add indexes if missing on frequently queried columns
    - _Requirements: 8.3_

- [ ] 9. Checkpoint — Verify performance optimizations
  - Ensure lazy loading, virtual scrolling, fetch cancellation, and query performance are working correctly, ask the user if questions arise.

- [ ] 10. Accessibility enhancements
  - [ ] 10.1 Add ARIA labels to all interactive elements
    - Add `aria-label` attributes to buttons, links, tabs, form inputs, and navigation elements
    - Add `aria-label` to verse list containers and tab list
    - Add `role` attributes where needed (`list`, `listitem`, `tabpanel`, `tab`)
    - _Requirements: 9.1_

  - [ ] 10.2 Set lang="ar" on all Arabic Quran text elements
    - Update `VerseItem.svelte` and any other components rendering Arabic text to include `lang="ar"` and `dir="rtl"` on Arabic text spans
    - _Requirements: 9.2_

  - [ ] 10.3 Implement keyboard navigation for panels, tabs, and verses
    - Add `tabindex="0"` to verse items and interactive elements
    - Implement Enter/Space key handlers on verse items for selection
    - Implement Arrow key navigation on `TabsList` to switch between Analysis Tabs
    - Ensure Tab key navigates between panels, tabs, verses, and interactive elements in logical order
    - Move focus to newly selected content when navigating via keyboard
    - _Requirements: 9.3, 9.4, 9.7_

  - [ ] 10.4 Ensure correct tab order and color contrast
    - Verify tab order follows visual layout direction (RTL for Persian, LTR for English)
    - Verify minimum 4.5:1 color contrast ratio for all text against its background
    - Adjust colors if any fail the contrast check
    - _Requirements: 9.5, 9.6_

  - [ ] 10.5 Add new i18n accessibility keys
    - Add keys to `fa.ts` and `en.ts`: `quran.verse_list`, `quran.verse_aria`, `analysis.tabs_label`, `nav.open_navigation`, `nav.open_analysis`, `nav.close_panel`, `app.loading`
    - _Requirements: 9.1, 9.2_

- [ ] 11. Checkpoint — Verify accessibility
  - Ensure ARIA labels, keyboard navigation, lang attributes, tab order, and color contrast are all correct, ask the user if questions arise.

- [ ] 12. Electron desktop polish
  - [ ] 12.1 Implement Electron window menu with standard entries
    - Update `electron/src/index.ts` to create a menu with File (Exit — Ctrl+Q), Edit (Undo, Redo, Cut, Copy, Paste), View (Zoom In — Ctrl+Plus, Zoom Out — Ctrl+Minus, Reset Zoom — Ctrl+0, Toggle Fullscreen — F11), and Help (About)
    - _Requirements: 10.1, 10.2_

  - [ ] 12.2 Implement window state persistence
    - Save window position, size, and maximized state to a JSON file in `app.getPath('userData')` on window close
    - Restore saved window state on app launch
    - Default to 1200×800 if no saved state exists
    - _Requirements: 10.3, 10.4_

  - [ ]* 12.3 Write property test for window state round-trip
    - **Property 5: Window State Round-Trip**
    - Test that saving and restoring window state produces identical position, size, and maximized state
    - **Validates: Requirements 10.3, 10.4**

  - [ ] 12.4 Create electron-utils for dynamic window title
    - Create `$lib/utils/electron-utils.ts` with `updateWindowTitle(surahName: string)` function
    - Set `document.title` to `Quran Ma — {surahName}` when on Electron platform
    - Call `updateWindowTitle` whenever the user navigates to a new Surah
    - _Requirements: 10.5_

  - [ ] 12.5 Add Ctrl+F keyboard shortcut for search focus
    - Wire Ctrl+F to focus the search input if available in the current view
    - _Requirements: 10.2_

- [ ] 13. Final checkpoint — Ensure all tests pass and Android build succeeds
  - Run all unit tests and property tests
  - Build the SvelteKit static output and run `npx cap sync android`
  - Produce a debug APK via `./gradlew assembleDebug`
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- The design uses TypeScript, Svelte, CSS, and Groovy (Gradle) — no language selection needed
- No new database tables or migrations are introduced in Phase 5
