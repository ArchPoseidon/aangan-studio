CREATE TABLE IF NOT EXISTS designers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  pin_hash TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  vaani_call_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'vaani',
  transcript TEXT NOT NULL,
  verdict TEXT,
  analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  call_id INT REFERENCES calls(id),
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  surname TEXT,
  property_location TEXT,
  property_type TEXT,
  property_kind TEXT NOT NULL DEFAULT 'flat',
  key_preferences TEXT,
  start_timeline TEXT,
  completion_timeline TEXT,
  meeting_date DATE,
  meeting_ampm TEXT,
  bullet_points JSONB NOT NULL DEFAULT '[]',
  insights JSONB NOT NULL DEFAULT '[]',
  missing_information JSONB NOT NULL DEFAULT '[]',
  flags JSONB NOT NULL DEFAULT '[]',
  transcript TEXT NOT NULL,
  designer_id INT REFERENCES designers(id),
  deal_value NUMERIC,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'lead',
  landed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  freshsales_lead_id TEXT,
  freshsales_deal_id TEXT,
  freshsales_won BOOLEAN NOT NULL DEFAULT false,
  freshsales_error TEXT
);

CREATE TABLE IF NOT EXISTS lead_updates (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  designer_id INT REFERENCES designers(id),
  kind TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  done BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  lead_id INT UNIQUE NOT NULL REFERENCES leads(id),
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'ideation',
  image TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS project_notes (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
