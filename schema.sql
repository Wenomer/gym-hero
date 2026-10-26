-- Gym Hero — схема D1 (SQLite).
-- boolean хранится как INTEGER 0/1, JSON-поля как TEXT(JSON), время как TEXT(ISO).

CREATE TABLE IF NOT EXISTS equipment (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  has_weight     INTEGER NOT NULL DEFAULT 1,
  default_weight REAL,
  loading        TEXT                       -- JSON | NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  equipment_id   TEXT,
  bilateral      INTEGER NOT NULL DEFAULT 0,
  default_weight REAL,
  notes          TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS workouts (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL,
  date                 TEXT NOT NULL,
  name                 TEXT NOT NULL DEFAULT '',
  type                 TEXT NOT NULL DEFAULT 'gym',
  laps                 TEXT,                 -- JSON array | NULL
  started_at           TEXT,
  ended_at             TEXT,
  planned_exercise_ids TEXT,                 -- JSON array | NULL
  created_at           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wk_user_date ON workouts(user_id, date);

CREATE TABLE IF NOT EXISTS sets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  date        TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  workout_id  TEXT,
  weight      REAL NOT NULL DEFAULT 0,
  reps        INTEGER NOT NULL DEFAULT 0,
  reps_r      INTEGER,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sets_user_date ON sets(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sets_workout  ON sets(workout_id);

CREATE TABLE IF NOT EXISTS routines (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  exercise_ids TEXT NOT NULL DEFAULT '[]',   -- JSON array
  created_at   TEXT NOT NULL
);

-- Аутентификация и ключи живут в сервисе auth-kit (service binding VAULT), здесь таблиц ключей нет.
