-- Migration 002: Course System Tables
-- Adds COURSE, BOOKMARK, TOPIC, TOPIC_VERSE, and COURSE_SETTINGS tables
-- for the Phase 2 course-based study workspace system.

CREATE TABLE IF NOT EXISTS COURSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS BOOKMARK (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  label TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id),
  UNIQUE(course_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS TOPIC (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_version INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE TABLE IF NOT EXISTS TOPIC_VERSE (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES TOPIC(id),
  UNIQUE(topic_id, surah_number, verse_number)
);

CREATE TABLE IF NOT EXISTS COURSE_SETTINGS (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL UNIQUE,
  default_translation_id INTEGER,
  last_surah INTEGER,
  last_verse INTEGER,
  FOREIGN KEY (course_id) REFERENCES COURSE(id)
);

CREATE INDEX IF NOT EXISTS idx_bookmark_course ON BOOKMARK(course_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_course_surah ON BOOKMARK(course_id, surah_number);
CREATE INDEX IF NOT EXISTS idx_topic_course ON TOPIC(course_id);
CREATE INDEX IF NOT EXISTS idx_topic_verse_topic ON TOPIC_VERSE(topic_id);
CREATE INDEX IF NOT EXISTS idx_course_settings_course ON COURSE_SETTINGS(course_id);
