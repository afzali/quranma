import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'ma.quran.app',
  appName: 'Quran Ma — قرآن ما',
  webDir: 'build',
  server: {
    // In development, point to the Vite dev server for HMR.
    // Electron will load http://localhost:5173 instead of the static build,
    // enabling Vite's Hot Module Replacement for live code changes.
    ...(isDev ? { url: 'http://localhost:5173', cleartext: true } : {})
  }
};

export default config;
