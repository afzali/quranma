# Design Document — Quran Ma Phase 5: Android Build and Platform Polish

## Overview

Phase 5 delivers the Android build via Capacitor, verifies cross-platform plugin compatibility (SQLite, Network), optimizes the UI for touch and mobile screens, adds performance improvements (lazy loading, virtual scrolling), ensures accessibility, and polishes the Electron desktop experience. No new database tables or migrations are introduced — this phase focuses on platform readiness and quality.

### Key Design Decisions

1. **@capacitor/android for native bridge**: Capacitor's Android platform wraps the SvelteKit static build in an Android WebView. All existing Capacitor plugins (@capacitor-community/sqlite, @capacitor/network, @capacitor/splash-screen) have native Android implementations.

2. **No new database migration**: Phase 5 does not add tables. SQLite verification is about confirming the existing migrations (001–004) run correctly on the Android native SQLite backend.

3. **Svelte dynamic imports for lazy loading**: Analysis tabs use `{#await import(...)}` or Svelte's `<svelte:component>` with dynamic imports to defer loading until the tab is activated.

4. **@tanstack/svelte-virtual for virtual scrolling**: A lightweight virtual scrolling library compatible with Svelte 5. Used for long verse lists (Surahs with 50+ verses).

5. **CSS-based touch target sizing**: Touch targets use `min-height: 44px; min-width: 44px` via a utility class. No JavaScript touch detection needed — CSS media queries (`pointer: coarse`) handle touch vs. mouse.

6. **Electron menu and shortcuts via Capacitor Electron's main process**: Window menu, keyboard shortcuts, and window state persistence are configured in the Electron main process file (`electron/src/index.ts`).

7. **Android safe areas via CSS env()**: `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` handle status bar and navigation bar overlap. The `viewport-fit=cover` meta tag enables edge-to-edge rendering.

## Architecture

### Platform Architecture (Phase 5 — no new layers, platform targets added)

```
┌──────────────────────────────────────────────────┐
│              SvelteKit SPA (Static Build)          │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │  UI Layer (Phase 1-4 components)            │   │
│  │  + Touch optimization (CSS)                 │   │
│  │  + Lazy-loaded Analysis Tabs                │   │
│  │  + Virtual scrolling for verse lists        │   │
│  │  + ARIA labels and keyboard navigation      │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │  State / Service / DAL Layers (unchanged)   │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │  Capacitor Plugin Bridge                    │   │
│  │  @capacitor-community/sqlite                │   │
│  │  @capacitor/network                         │   │
│  │  @capacitor/splash-screen                   │   │
│  │  @capacitor/status-bar                      │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
└──────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────────┐
│ Capacitor        │  │  Capacitor Android   │
│ Electron         │  │  (Android WebView)   │
│ (Windows)        │  │                      │
└─────────────────┘  └─────────────────────┘
```

## Components and Interfaces

### Capacitor Android Configuration

#### capacitor.config.ts updates

```typescript
// Updated capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quranma.app',
  appName: 'Quran Ma',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false, // manually hide after DB init
      backgroundColor: '#1a1a2e',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      launchFadeOutDuration: 300,
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
      electronIsEncryption: false,
    },
  },
};

export default config;
```

#### Android build.gradle (app-level) key settings

```groovy
android {
    namespace 'com.quranma.app'
    compileSdk 34

    defaultConfig {
        applicationId "com.quranma.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
            keyAlias System.getenv("KEY_ALIAS") ?: ""
            keyPassword System.getenv("KEY_PASSWORD") ?: ""
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### Splash Screen Integration

```typescript
// Updated +layout.svelte — splash screen dismissal
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

onMount(async () => {
  await initDatabase();
  await initI18n();
  await restoreSelection();
  await initNetworkContext();
  await restoreAuth();
  ready = true;

  // Dismiss splash screen after init completes
  if (Capacitor.isNativePlatform()) {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  }
});
```

### Status Bar Configuration

```typescript
// Called during app init on Android
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export async function configureStatusBar(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
  await StatusBar.setStyle({ style: Style.Dark });
}
```

### Touch Optimization

#### CSS utility for touch targets

```css
/* Added to app.css */
@media (pointer: coarse) {
  .touch-target {
    min-height: 44px;
    min-width: 44px;
    padding: 8px;
  }

  .touch-target-lg {
    min-height: 48px;
    min-width: 48px;
    padding: 12px;
  }
}
```

#### Swipe gesture for panel toggling

```typescript
// $lib/utils/swipe-gesture.ts
export interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // minimum px to trigger, default 50
}

export function swipeGesture(node: HTMLElement, options: SwipeOptions) {
  let startX = 0;
  let startY = 0;
  const threshold = options.threshold ?? 50;

  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;

    // Only trigger if horizontal movement > vertical movement
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      if (diffX > 0) options.onSwipeRight?.();
      else options.onSwipeLeft?.();
    }
  }

  node.addEventListener('touchstart', handleTouchStart, { passive: true });
  node.addEventListener('touchend', handleTouchEnd, { passive: true });

  return {
    destroy() {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchend', handleTouchEnd);
    },
    update(newOptions: SwipeOptions) {
      options = newOptions;
    },
  };
}
```

#### Swipe integration in MobileOverlay

```svelte
<!-- Updated MobileOverlay.svelte -->
<script lang="ts">
  import { swipeGesture } from '$lib/utils/swipe-gesture';
  import { toggleNavBar, toggleAnalysisPanel } from '$lib/state/ui-context.svelte';
</script>

<div
  use:swipeGesture={{
    onSwipeLeft: () => toggleAnalysisPanel(),
    onSwipeRight: () => toggleNavBar(),
    threshold: 50,
  }}
>
  <slot />
</div>
```

### Safe Area Handling

```css
/* Added to app.css */
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}

.app-shell {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  padding-left: var(--safe-area-left);
  padding-right: var(--safe-area-right);
}
```

```html
<!-- Updated app.html -->
<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

### Lazy Loading for Analysis Tabs

```svelte
<!-- Updated AnalysisTabs.svelte — lazy loading pattern -->
<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui-rtl/tabs';

  let activeTab = $state('word-data');
  let loadedTabs = $state<Set<string>>(new Set());

  // Mark tab as loaded when first activated
  $effect(() => {
    if (activeTab) {
      loadedTabs.add(activeTab);
      loadedTabs = new Set(loadedTabs); // trigger reactivity
    }
  });

  // Dynamic imports — only loaded when tab is first visited
  const tabComponents: Record<string, () => Promise<any>> = {
    'word-data': () => import('./tabs/WordDataTab.svelte'),
    'translation': () => import('./tabs/TranslationTab.svelte'),
    'tafsir': () => import('./tabs/TafsirTab.svelte'),
    'siyaq': () => import('./tabs/SiyaqTab.svelte'),
    'nazm-kavi': () => import('./tabs/NazmKaviTab.svelte'),
    'shabake-kavi': () => import('./tabs/ShabakeKaviTab.svelte'),
    'eqameh': () => import('./tabs/EqamehTab.svelte'),
  };
</script>

<Tabs bind:value={activeTab}>
  <TabsList aria-label={t('analysis.tabs_label')}>
    {#each Object.keys(tabComponents) as tabId}
      <TabsTrigger value={tabId} role="tab" aria-selected={activeTab === tabId}>
        {t(`analysis.tab.${tabId}`)}
      </TabsTrigger>
    {/each}
  </TabsList>

  {#each Object.entries(tabComponents) as [tabId, loader]}
    <TabsContent value={tabId} role="tabpanel">
      {#if loadedTabs.has(tabId)}
        {#await loader() then module}
          <svelte:component this={module.default} />
        {/await}
      {/if}
    </TabsContent>
  {/each}
</Tabs>
```

### Virtual Scrolling for Verse Lists

```svelte
<!-- Updated VerseList.svelte — virtual scrolling for long Surahs -->
<script lang="ts">
  import { createVirtualizer } from '@tanstack/svelte-virtual';
  import VerseItem from './VerseItem.svelte';
  import type { Verse } from '$lib/data/repositories/quran-repository';

  let { verses }: { verses: Verse[] } = $props();

  const VIRTUAL_THRESHOLD = 50;
  const useVirtual = $derived(verses.length > VIRTUAL_THRESHOLD);

  let scrollElement: HTMLDivElement;

  const virtualizer = $derived(
    useVirtual
      ? createVirtualizer({
          count: verses.length,
          getScrollElement: () => scrollElement,
          estimateSize: () => 80, // estimated verse height in px
          overscan: 10,
        })
      : null
  );
</script>

{#if useVirtual && virtualizer}
  <div bind:this={scrollElement} class="verse-list-virtual" role="list" aria-label={t('quran.verse_list')}>
    <div style="height: {virtualizer.getTotalSize()}px; position: relative;">
      {#each virtualizer.getVirtualItems() as row (row.index)}
        <div
          style="position: absolute; top: 0; left: 0; width: 100%; transform: translateY({row.start}px);"
          role="listitem"
        >
          <VerseItem verse={verses[row.index]} />
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="verse-list" role="list" aria-label={t('quran.verse_list')}>
    {#each verses as verse (verse.id)}
      <VerseItem {verse} />
    {/each}
  </div>
{/if}
```

### Accessibility Enhancements

#### Arabic text lang attribute

```svelte
<!-- Updated VerseItem.svelte — lang attribute for Arabic -->
<div
  class="verse-item touch-target"
  role="listitem"
  tabindex="0"
  aria-label={t('quran.verse_aria', { surah: verse.surahNumber, verse: verse.verseNumber })}
  on:click={() => selectVerse(verse.surahNumber, verse.verseNumber)}
  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectVerse(verse.surahNumber, verse.verseNumber); }}
>
  <span class="verse-number" aria-hidden="true">{toArabicNumeral(verse.verseNumber)}</span>
  <span lang="ar" dir="rtl" class="verse-text">{verse.textArabic}</span>
</div>
```

#### Keyboard navigation for Analysis Tabs

```svelte
<!-- TabsList keyboard handler -->
<script lang="ts">
  function handleTabKeydown(e: KeyboardEvent) {
    const tabs = Object.keys(tabComponents);
    const currentIndex = tabs.indexOf(activeTab);

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      activeTab = tabs[nextIndex];
    }
  }
</script>
```

### Electron Desktop Polish

#### Window menu and shortcuts (electron/src/index.ts)

```typescript
// electron/src/index.ts — menu and window state
import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const WINDOW_STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

function loadWindowState(): WindowState {
  try {
    const data = fs.readFileSync(WINDOW_STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { width: 1200, height: 800, isMaximized: false };
  }
}

function saveWindowState(win: BrowserWindow): void {
  const bounds = win.getBounds();
  const state: WindowState = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: win.isMaximized(),
  };
  fs.writeFileSync(WINDOW_STATE_FILE, JSON.stringify(state));
}

function createMenu(win: BrowserWindow): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [{ label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => win.setFullScreen(!win.isFullScreen()) },
      ],
    },
    {
      label: 'Help',
      submenu: [{ label: 'About Quran Ma', click: () => { /* show about dialog */ } }],
    },
  ];

  return Menu.buildFromTemplate(template);
}
```

#### Window title update (via IPC from renderer)

```typescript
// $lib/utils/electron-utils.ts
import { Capacitor } from '@capacitor/core';

export function updateWindowTitle(surahName: string): void {
  if (Capacitor.getPlatform() === 'electron') {
    document.title = `Quran Ma — ${surahName}`;
  }
}
```

## Data Models

No new tables or migrations are introduced in Phase 5. All existing tables from Phase 1–4 remain unchanged.

## Updated File Structure (Phase 5 additions)

```
client/
├── android/                                    # NEW — Capacitor Android project
│   ├── app/
│   │   ├── build.gradle                        # App-level Gradle config
│   │   ├── proguard-rules.pro                  # ProGuard rules for release
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── res/
│   │       │   ├── drawable/splash.xml         # Splash screen drawable
│   │       │   ├── mipmap-mdpi/                # App icons
│   │       │   ├── mipmap-hdpi/
│   │       │   ├── mipmap-xhdpi/
│   │       │   ├── mipmap-xxhdpi/
│   │       │   ├── mipmap-xxxhdpi/
│   │       │   └── values/
│   │       │       ├── styles.xml              # Splash theme
│   │       │       └── colors.xml
│   │       └── java/.../MainActivity.java
│   ├── build.gradle                            # Project-level Gradle config
│   ├── gradle.properties
│   └── settings.gradle
├── src/
│   ├── app.html                                # Updated: viewport-fit=cover
│   ├── app.css                                 # Updated: safe areas, touch targets
│   └── lib/
│       ├── components/
│       │   ├── analysis/
│       │   │   └── AnalysisTabs.svelte         # Updated: lazy loading
│       │   ├── quran/
│       │   │   ├── VerseList.svelte            # Updated: virtual scrolling
│       │   │   └── VerseItem.svelte            # Updated: ARIA, lang="ar", touch
│       │   └── shared/
│       │       └── MobileOverlay.svelte        # Updated: swipe gestures
│       ├── utils/
│       │   ├── swipe-gesture.ts                # NEW — Svelte action for swipe
│       │   ├── electron-utils.ts               # NEW — window title helper
│       │   └── status-bar.ts                   # NEW — Android status bar config
│       └── i18n/
│           ├── fa.ts                           # Updated: accessibility keys
│           └── en.ts                           # Updated: accessibility keys
├── electron/
│   └── src/
│       └── index.ts                            # Updated: menu, shortcuts, window state
└── capacitor.config.ts                         # Updated: Android + splash config
```

### New i18n Keys

```typescript
// Additions to fa.ts and en.ts
{
  'quran.verse_list': 'لیست آیات' / 'Verse list',
  'quran.verse_aria': 'سوره {surah}، آیه {verse}' / 'Surah {surah}, Verse {verse}',
  'analysis.tabs_label': 'تب‌های تحلیل' / 'Analysis tabs',
  'nav.open_navigation': 'باز کردن فهرست' / 'Open navigation',
  'nav.open_analysis': 'باز کردن تحلیل' / 'Open analysis',
  'nav.close_panel': 'بستن پنل' / 'Close panel',
  'app.loading': 'در حال بارگذاری...' / 'Loading...',
}
```

## Correctness Properties

### Property 1: Virtual Scrolling Completeness
FOR ALL Surahs, the total number of verses accessible through the virtual scrolling list SHALL equal the verse_count of that Surah. Scrolling to the end SHALL render the last verse.

### Property 2: Lazy Loading Idempotence
FOR ALL Analysis_Tabs, loading a tab, switching away, and switching back SHALL produce the same rendered state. Loading a tab multiple times SHALL not create duplicate component instances.

### Property 3: Swipe Gesture Directionality
FOR ALL swipe gestures where horizontal displacement exceeds vertical displacement and exceeds the threshold, a rightward swipe SHALL trigger onSwipeRight and a leftward swipe SHALL trigger onSwipeLeft. Diagonal or short swipes SHALL not trigger either callback.

### Property 4: Safe Area Inset Application
FOR ALL Android devices with non-zero safe area insets, the App content SHALL not overlap with the Status_Bar or system navigation bar.

### Property 5: Window State Round-Trip
FOR ALL valid window positions and sizes, saving window state on close and restoring on next launch SHALL produce a window with the same position, size, and maximized state.

### Property 6: Touch Target Minimum Size
FOR ALL interactive elements on touch-enabled devices, the rendered element SHALL have a minimum tap area of 44×44 CSS pixels.
