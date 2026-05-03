# Requirements Document — Quran Ma Phase 5: Android Build and Platform Polish

## Introduction

Phase 5 is the final phase of the Quran Ma project. It delivers the Android build of the application via Capacitor, verifies that all existing functionality (SQLite, network detection, sync) works correctly on Android, optimizes the UI for touch input and mobile screen sizes, adds performance optimizations (lazy loading, virtual scrolling), ensures accessibility compliance, and polishes the Electron desktop experience with keyboard shortcuts and window state persistence.

## Glossary

- **App**: The Quran Ma client application (SvelteKit + Capacitor), as established in Phase 1
- **User**: A person interacting with the App
- **Android_Project**: The Capacitor Android native project generated under `client/android/`, containing Gradle build files and Android manifest
- **Capacitor_Android**: The @capacitor/android package that bridges the SvelteKit SPA to the Android native runtime
- **SQLite_Plugin**: The @capacitor-community/sqlite plugin used for local database access across all platforms
- **Network_Plugin**: The @capacitor/network plugin used for online/offline detection across all platforms
- **Touch_Target**: An interactive UI element (button, link, list item) sized for reliable finger tapping on touchscreens
- **Three_Panel_Layout**: The paneforge-based horizontal layout with Analysis (left), Quran Display (center), and Navigation (right) panels
- **Mobile_Overlay**: The overlay-based navigation and analysis panel display used on screens narrower than 768px
- **Analysis_Tabs**: The seven analysis tabs (Word Data, Translation, Tafsir, Siyaq, Nazm-Kavi, Shabake-Kavi, Eqameh) from Phase 3
- **Virtual_Scrolling**: A rendering technique that only mounts DOM elements for visible items in a long list, reducing memory and improving scroll performance
- **Lazy_Loading**: Deferring the initialization and rendering of a component until the User navigates to it
- **APK**: Android Package file, the installable binary for Android devices
- **AAB**: Android App Bundle, the publishing format for Google Play Store
- **Splash_Screen**: A branded loading screen shown while the App initializes on Android
- **Electron_App**: The desktop build of the App using @capacitor-community/electron for Windows
- **Status_Bar**: The Android system bar at the top of the screen showing time, battery, and notifications
- **Gradle**: The build system used by the Android_Project for compilation, signing, and packaging

---

## Requirements

### Requirement 1: Capacitor Android Project Initialization

**User Story:** As a developer, I want the Capacitor Android project initialized and configured, so that the App can be built and deployed on Android devices.

#### Acceptance Criteria

1. THE App SHALL include @capacitor/android as a dependency and have a valid Android_Project under `client/android/`
2. THE Android_Project SHALL target a minimum Android SDK version of 24 (Android 7.0) and a compile SDK version of 34
3. THE Android_Project SHALL have a valid application ID (e.g., `com.quranma.app`) configured in the Gradle build file
4. THE capacitor.config.ts SHALL include Android-specific configuration for the webview and server settings
5. WHEN the developer runs `npx cap sync android`, THE Capacitor CLI SHALL copy the SvelteKit static build and all plugins into the Android_Project without errors

---

### Requirement 2: Android SQLite Verification

**User Story:** As a developer, I want to verify that SQLite works correctly on Android, so that all database operations function on mobile devices.

#### Acceptance Criteria

1. THE SQLite_Plugin SHALL use the native Android SQLite backend when running on Android
2. WHEN the App starts on Android, THE App SHALL run all database migrations (001 through 004) successfully without data loss
3. THE App SHALL read and write to all tables (SURAH, VERSE, WORD, APP_SETTINGS, COURSE, BOOKMARK, TOPIC, SYNC_QUEUE, and all analysis tables) on Android without errors
4. IF a database migration fails on Android, THEN THE App SHALL display an error message to the User and prevent further database operations until the issue is resolved

---

### Requirement 3: Android Network Detection Verification

**User Story:** As a developer, I want to verify that network detection works correctly on Android, so that online/offline sync behavior functions on mobile devices.

#### Acceptance Criteria

1. THE Network_Plugin SHALL detect the current network connection status on Android (connected via WiFi, cellular, or disconnected)
2. WHEN the Android device transitions between online and offline states, THE App SHALL update the Network_Status state and trigger sync operations as defined in Phase 4
3. THE Network_Indicator component SHALL display the correct online/offline status on Android

---

### Requirement 4: Touch Input Optimization

**User Story:** As a user, I want all interactive elements to be easy to tap on my Android phone, so that I can use the App comfortably with touch input.

#### Acceptance Criteria

1. THE App SHALL render all Touch_Targets with a minimum size of 44×44 CSS pixels on touch-enabled devices
2. THE App SHALL support swipe gestures on Android for toggling the Navigation and Analysis panels in Mobile_Overlay mode
3. WHEN the User taps a verse in the Quran Display on Android, THE App SHALL select that verse with the same behavior as a desktop click
4. THE App SHALL not display hover-only UI elements on touch-enabled devices — all interactive states SHALL be accessible via tap
5. THE App SHALL use appropriate touch feedback (ripple or highlight) on interactive elements on Android

---

### Requirement 5: Responsive Layout on Android

**User Story:** As a user, I want the App layout to adapt to my Android phone screen, so that I can read the Quran comfortably on a small screen.

#### Acceptance Criteria

1. WHEN the screen width is less than 768px, THE Three_Panel_Layout SHALL collapse to a single-panel view showing only the Quran Display, with Navigation and Analysis accessible via Mobile_Overlay
2. THE Mobile_Overlay SHALL function correctly on Android, including opening, closing, and scrolling within overlay panels
3. THE Quran Display SHALL fill the available screen width on Android without horizontal scrolling
4. THE App SHALL respect the Android Status_Bar and navigation bar safe areas, preventing content from being obscured by system UI
5. WHEN the Android device is rotated between portrait and landscape, THE App SHALL re-render the layout appropriately without losing the current selection state

---

### Requirement 6: Android App Icon and Splash Screen

**User Story:** As a user, I want to see a branded app icon and splash screen on my Android device, so that the App looks professional and polished.

#### Acceptance Criteria

1. THE Android_Project SHALL include an app icon in all required densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) following Android adaptive icon guidelines
2. THE App SHALL display a Splash_Screen with the App logo on a solid background while the App initializes on Android
3. WHEN the App finishes initializing (database ready, UI rendered), THE Splash_Screen SHALL be dismissed automatically
4. THE Splash_Screen SHALL use @capacitor/splash-screen for configuration and dismissal
5. THE Android Status_Bar color SHALL match the App theme (dark background for dark theme)

---

### Requirement 7: Android Build Pipeline

**User Story:** As a developer, I want a configured Gradle build pipeline, so that I can produce signed APK and AAB files for distribution.

#### Acceptance Criteria

1. THE Android_Project SHALL produce a debug APK via `./gradlew assembleDebug` without errors
2. THE Android_Project SHALL produce a release AAB via `./gradlew bundleRelease` when provided with a signing keystore
3. THE Gradle build file SHALL configure ProGuard/R8 minification for release builds
4. THE Android_Project SHALL include a signing configuration that reads keystore credentials from environment variables or a local properties file (not committed to version control)
5. WHEN the developer runs the build pipeline, THE output APK or AAB SHALL contain the correct application ID, version name, and version code

---

### Requirement 8: Performance Optimization

**User Story:** As a user, I want the App to load quickly and scroll smoothly, so that I have a responsive experience on both desktop and Android.

#### Acceptance Criteria

1. THE App SHALL lazy-load each Analysis_Tab component, initializing it only when the User navigates to that tab for the first time
2. THE App SHALL use Virtual_Scrolling for verse lists in Surahs with more than 50 verses, rendering only the visible verses plus a buffer
3. THE App SHALL use indexed SQLite queries for all verse lookups, search operations, and bookmark queries to minimize query time
4. WHEN the User switches between Surahs, THE App SHALL cancel any in-progress data fetches for the previous Surah before starting new fetches
5. THE App SHALL keep the initial bundle size under 500KB of JavaScript (gzipped) by code-splitting analysis tab components

---

### Requirement 9: Accessibility

**User Story:** As a user with accessibility needs, I want the App to work with screen readers and keyboard navigation, so that I can use the App regardless of my abilities.

#### Acceptance Criteria

1. THE App SHALL provide ARIA labels on all interactive elements, including buttons, links, tabs, and form inputs
2. THE App SHALL set the `lang` attribute to "ar" on all Arabic Quran text elements so that screen readers use the correct pronunciation engine
3. THE App SHALL support full keyboard navigation on desktop, allowing the User to navigate between panels, tabs, verses, and interactive elements using Tab, Arrow keys, and Enter
4. WHEN the User navigates to a new Surah or verse via keyboard, THE App SHALL move focus to the newly selected content
5. THE App SHALL maintain a logical tab order that follows the visual layout direction (RTL for Persian, LTR for English)
6. THE App SHALL ensure a minimum color contrast ratio of 4.5:1 for all text content against its background
7. THE Analysis_Tabs SHALL be navigable via keyboard using Arrow keys to switch between tabs and Enter to activate a tab

---

### Requirement 10: Electron Desktop Polish

**User Story:** As a desktop user, I want keyboard shortcuts, a proper window menu, and window state persistence, so that the desktop experience feels native and efficient.

#### Acceptance Criteria

1. THE Electron_App SHALL provide a window menu with standard entries: File (Exit), Edit (Undo, Redo, Cut, Copy, Paste), View (Zoom In, Zoom Out, Reset Zoom, Toggle Fullscreen), and Help (About)
2. THE Electron_App SHALL support keyboard shortcuts: Ctrl+Q (quit), Ctrl+Plus/Minus (zoom), Ctrl+0 (reset zoom), F11 (fullscreen), Ctrl+F (focus search if available)
3. WHEN the User closes the Electron_App, THE App SHALL save the window position, size, and maximized state to local storage
4. WHEN the Electron_App starts, THE App SHALL restore the previously saved window position, size, and maximized state
5. THE Electron_App SHALL set the window title to the App name and current Surah name (e.g., "Quran Ma — Al-Fatiha")
