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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
