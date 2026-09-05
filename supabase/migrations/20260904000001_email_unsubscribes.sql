-- Suppress outbound mail after a panelist unsubscribes or closes their account.

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  email citext PRIMARY KEY,
  scope text NOT NULL DEFAULT 'outreach'
    CHECK (scope IN ('outreach', 'all')),
  reason text NOT NULL DEFAULT 'user_request',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_unsubscribes_scope_idx ON email_unsubscribes (scope);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
