-- Gym Configurator Projects table
CREATE TABLE IF NOT EXISTS gym_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Proiect Sală',
  variant TEXT NOT NULL CHECK (variant IN ('plan_existing', 'from_scratch')),
  total_area NUMERIC(10,2) NOT NULL,
  length_m NUMERIC(10,2) NOT NULL,
  width_m NUMERIC(10,2) NOT NULL,
  zones JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_projects_client ON gym_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_gym_projects_status ON gym_projects(status);
