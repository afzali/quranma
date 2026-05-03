-- Migration 001: Add APP_SETTINGS table
-- The bundled quranoma.db already contains the full Quran schema
-- (surah, ayah, word, translation, tafsir, etc.).
-- This migration adds the application settings table on top.

CREATE TABLE IF NOT EXISTS APP_SETTINGS (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Default settings
INSERT OR IGNORE INTO APP_SETTINGS (key, value) VALUES ('db_version', '1');
INSERT OR IGNORE INTO APP_SETTINGS (key, value) VALUES ('locale', 'fa');
