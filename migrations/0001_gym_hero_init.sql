-- Общая база looneyhome_database: все таблицы и индексы сервиса с префиксом gym_hero_
-- boolean хранится как INTEGER 0/1, JSON-поля как TEXT(JSON), время как TEXT(ISO).
-- user_id: числовой userId из auth-kit строкой (String(who.userId)).

CREATE TABLE gym_hero_equipment (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  has_weight     INTEGER NOT NULL DEFAULT 1,
  default_weight REAL,
  loading        TEXT                       -- JSON | NULL
);

CREATE TABLE gym_hero_exercises (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  equipment_id   TEXT,
  bilateral      INTEGER NOT NULL DEFAULT 0,
  default_weight REAL,
  notes          TEXT NOT NULL DEFAULT ''
);

CREATE TABLE gym_hero_workouts (
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
CREATE INDEX idx_gym_hero_workouts_user_date ON gym_hero_workouts(user_id, date);

CREATE TABLE gym_hero_sets (
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
CREATE INDEX idx_gym_hero_sets_user_date ON gym_hero_sets(user_id, date);
CREATE INDEX idx_gym_hero_sets_workout   ON gym_hero_sets(workout_id);

CREATE TABLE gym_hero_routines (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  exercise_ids TEXT NOT NULL DEFAULT '[]',   -- JSON array
  created_at   TEXT NOT NULL
);

-- Аутентификация и ключи живут в сервисе auth-kit (service binding VAULT), здесь таблиц ключей нет.
