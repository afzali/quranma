-- Migration 003: Analysis Panel Tables
-- Adds tables for Phase 3 analysis features: word data, user translations,
-- user tafsirs, siyaq groups, nazm-kavi items, shabake-kavi connections,
-- and eqameh entries. All user-generated data is scoped to a course.
--
-- NOTE: Translation and tafsir *resource* tables already exist in the bundled
-- quranoma.db as `translator`, `translation`, `tafsir_source`, and `tafsir`.
-- This migration only creates user-facing / course-scoped tables.

CREATE TABLE IF NOT EXISTS USER_WORD_DATA (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  word_position INTEGER NOT NULL,
  personal_meaning TEXT,
  selected_meaning TEXT,
  note TEXT,
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id),
  UNIQUE(course_id, surah_number, verse_number, word_position)
);

CREATE TABLE IF NOT EXISTS USER_TRANSLATION (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  personal_translation TEXT,
  note TEXT,
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id),
  UNIQUE(course_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS USER_TAFSIR (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  personal_tafsir TEXT,
  note TEXT,
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id),
  UNIQUE(course_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS SIYAQ_GROUP (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE TABLE IF NOT EXISTS SIYAQ_VERSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siyaq_group_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  FOREIGN KEY (siyaq_group_id) REFERENCES SIYAQ_GROUP(id),
  UNIQUE(siyaq_group_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS NAZM_KAVI_ITEM (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('repetition', 'contrast', 'axis', 'pattern')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE TABLE IF NOT EXISTS NAZM_KAVI_VERSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nazm_kavi_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  FOREIGN KEY (nazm_kavi_id) REFERENCES NAZM_KAVI_ITEM(id)
);

CREATE TABLE IF NOT EXISTS SHABAKE_KAVI_CONNECTION (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  source_surah INTEGER NOT NULL,
  source_verse INTEGER NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('verse', 'hadith', 'story', 'concept', 'external', 'video')),
  target_reference TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE TABLE IF NOT EXISTS EQAMEH_ENTRY (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER,
  type TEXT NOT NULL CHECK(type IN ('principle', 'duty', 'message', 'decision', 'action')),
  text_content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_word_data_course_verse ON USER_WORD_DATA(course_id, surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_user_translation_course_verse ON USER_TRANSLATION(course_id, surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_user_tafsir_course_verse ON USER_TAFSIR(course_id, surah_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_siyaq_group_course_surah ON SIYAQ_GROUP(course_id, surah_number);
CREATE INDEX IF NOT EXISTS idx_siyaq_verse_group ON SIYAQ_VERSE(siyaq_group_id);
CREATE INDEX IF NOT EXISTS idx_nazm_kavi_item_course ON NAZM_KAVI_ITEM(course_id);
CREATE INDEX IF NOT EXISTS idx_nazm_kavi_verse_item ON NAZM_KAVI_VERSE(nazm_kavi_id);
CREATE INDEX IF NOT EXISTS idx_shabake_kavi_course_source ON SHABAKE_KAVI_CONNECTION(course_id, source_surah, source_verse);
CREATE INDEX IF NOT EXISTS idx_eqameh_course_surah ON EQAMEH_ENTRY(course_id, surah_number);

-- Update db_version
UPDATE APP_SETTINGS SET value = '3' WHERE key = 'db_version';
