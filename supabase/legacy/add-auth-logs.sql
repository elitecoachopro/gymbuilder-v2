-- Create auth_logs table for tracking failed login attempts
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  email_attempted TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'login_failed',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by IP and email
CREATE INDEX IF NOT EXISTS idx_auth_logs_ip ON auth_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_logs_email ON auth_logs(email_attempted);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at DESC);
