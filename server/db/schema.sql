CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    case_name TEXT NOT NULL,
    module TEXT NOT NULL,
    status TEXT NOT NULL,
    owner TEXT NOT NULL,
    organization TEXT DEFAULT '',
    examiner TEXT DEFAULT '',
    aircraft_type TEXT DEFAULT '',
    location TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    last_updated DATE,
    occurrence_date DATE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    analyses JSONB NOT NULL DEFAULT '{}',
    timeline JSONB NOT NULL DEFAULT '[]',
    attachments JSONB NOT NULL DEFAULT '[]',
    investigator JSONB NOT NULL DEFAULT '{}',
    aircraft JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure legacy installations pick up newly required columns
ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS module TEXT NOT NULL DEFAULT 'CVR & FDR';

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Data Incomplete';

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS owner TEXT NOT NULL DEFAULT '';

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT '';

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS examiner TEXT DEFAULT '';

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS aircraft_type TEXT DEFAULT '';

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS last_updated DATE;

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS occurrence_date DATE;

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS analyses JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS timeline JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS investigator JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS aircraft JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION set_cases_updated_at()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cases_updated_at_trigger ON cases;
CREATE TRIGGER set_cases_updated_at_trigger
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION set_cases_updated_at();

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    organization TEXT NOT NULL DEFAULT '',
    job_title TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at_trigger ON users;
CREATE TRIGGER set_users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_users_updated_at();
