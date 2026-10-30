-- Older hosted installations used different login-log fields and integer budgets.
ALTER TABLE public.auth_logs ADD COLUMN IF NOT EXISTS email_attempted text;
ALTER TABLE public.auth_logs ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'login_failed';
ALTER TABLE public.budget_estimates ALTER COLUMN area_sqm TYPE numeric(10,2);
ALTER TABLE public.budget_estimates ALTER COLUMN total_min TYPE numeric(14,2);
ALTER TABLE public.budget_estimates ALTER COLUMN total_max TYPE numeric(14,2);
NOTIFY pgrst, 'reload schema';
