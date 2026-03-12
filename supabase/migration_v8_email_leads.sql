-- Migration v8: email_leads table for landing page email capture

CREATE TABLE IF NOT EXISTS email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_leads_email_idx ON email_leads(email);

ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;

-- Only the service role can read/write email leads (no public access)
