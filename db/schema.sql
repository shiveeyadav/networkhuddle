-- NetworkHuddle schema. Idempotent: safe to run on every start.

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_member       BOOLEAN NOT NULL DEFAULT FALSE,
  member_since    TIMESTAMPTZ,
  is_suspended    BOOLEAN NOT NULL DEFAULT FALSE,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  business_name   TEXT NOT NULL DEFAULT '',
  job_role        TEXT NOT NULL DEFAULT '',
  region          TEXT NOT NULL DEFAULT '',
  industry        TEXT NOT NULL DEFAULT '',
  website         TEXT NOT NULL DEFAULT '',
  bio             TEXT NOT NULL DEFAULT '',
  offer           TEXT NOT NULL DEFAULT '',
  looking_for     TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT NOT NULL DEFAULT '',
  linkedin_url    TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_region_idx ON users (region);
CREATE INDEX IF NOT EXISTS users_industry_idx ON users (industry);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id);

CREATE TABLE IF NOT EXISTS events (
  id                SERIAL PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  format            TEXT NOT NULL CHECK (format IN ('online', 'speed', 'face2face')),
  theme             TEXT NOT NULL DEFAULT 'general',
  region            TEXT NOT NULL DEFAULT '',
  starts_at         TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 10 AND 600),
  venue_name        TEXT NOT NULL DEFAULT '',
  venue_address     TEXT NOT NULL DEFAULT '',
  online_link       TEXT NOT NULL DEFAULT '',
  capacity          INTEGER NOT NULL CHECK (capacity > 0),
  description       TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
  created_by        INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_starts_idx ON events (starts_at);

CREATE TABLE IF NOT EXISTS bookings (
  id          SERIAL PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id);

CREATE TABLE IF NOT EXISTS one_to_ones (
  id             SERIAL PRIMARY KEY,
  requester_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  recipient_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  proposed_at    TIMESTAMPTZ NOT NULL,
  message        TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  response_note  TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS one_to_ones_requester_idx ON one_to_ones (requester_id);
CREATE INDEX IF NOT EXISTS one_to_ones_recipient_idx ON one_to_ones (recipient_id);

CREATE TABLE IF NOT EXISTS app_meta (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL DEFAULT ''
);
