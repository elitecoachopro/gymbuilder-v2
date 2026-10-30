ALTER TABLE public.users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0 CHECK (session_version >= 0);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token) WHERE verification_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_reset_token ON public.users(reset_token) WHERE reset_token IS NOT NULL;
NOTIFY pgrst, 'reload schema';
