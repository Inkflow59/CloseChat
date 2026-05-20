-- Schema minimal pour CloseChat (comptes + crash reporter self-hosted)
-- Utilise pgcrypto pour gen_random_uuid()

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  username text UNIQUE,
  password_hash text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '😊',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'dnd')),
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Crash reports envoyés par l'app Electron via electron.crashReporter
CREATE TABLE IF NOT EXISTS crash_reports (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  app_version text NULL,
  platform text NULL,
  exception text NULL,
  stack text NULL,
  crash_id text NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crash_reports_created_at
  ON crash_reports (created_at);

CREATE INDEX IF NOT EXISTS idx_crash_reports_user_id
  ON crash_reports (user_id);

-- Comptes de test (mot de passe : test1234)
INSERT INTO users (email, username, password_hash) VALUES
  ('alice@closechat.local', 'Alice', '$2b$12$0riPxulKuNCeOZPPcWoFzOdjq8KXI3rfGp.AcMxwKomW5xymnVU8O'),
  ('bob@closechat.local',   'Bob',   '$2b$12$0riPxulKuNCeOZPPcWoFzOdjq8KXI3rfGp.AcMxwKomW5xymnVU8O')
ON CONFLICT DO NOTHING;