CREATE TABLE consents (
 user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
 terms_version text NOT NULL,
 adult_attested_at timestamptz NOT NULL DEFAULT now(),
 accepted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_consents ON consents FOR SELECT TO mova_app USING(user_id=actor());
GRANT SELECT ON consents TO mova_app;
