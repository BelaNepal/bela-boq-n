-- Create quotations table for storing quotation details
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES boq_projects(id) ON DELETE CASCADE,
  quotation_number VARCHAR(255) NOT NULL,
  quotation_date DATE NOT NULL,
  validity_days INTEGER DEFAULT 30,
  grand_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, quotation_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotations_project_id ON quotations(project_id);
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_number ON quotations(quotation_number);

-- Enable Row Level Security
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- 🔥 Drop old policies if they already exist
DROP POLICY IF EXISTS "Users can view quotations for their projects" ON quotations;
DROP POLICY IF EXISTS "Users can create quotations for their projects" ON quotations;
DROP POLICY IF EXISTS "Users can update quotations for their projects" ON quotations;
DROP POLICY IF EXISTS "Users can delete quotations for their projects" ON quotations;

-- Create policies

-- View
CREATE POLICY "Users can view quotations for their projects"
ON quotations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM boq_projects
    WHERE boq_projects.id = quotations.project_id
      AND boq_projects.user_id = auth.uid()
  )
);

-- Insert
CREATE POLICY "Users can create quotations for their projects"
ON quotations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boq_projects
    WHERE boq_projects.id = project_id
      AND boq_projects.user_id = auth.uid()
  )
);

-- Update
CREATE POLICY "Users can update quotations for their projects"
ON quotations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM boq_projects
    WHERE boq_projects.id = quotations.project_id
      AND boq_projects.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boq_projects
    WHERE boq_projects.id = quotations.project_id
      AND boq_projects.user_id = auth.uid()
  )
);

-- Delete
CREATE POLICY "Users can delete quotations for their projects"
ON quotations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM boq_projects
    WHERE boq_projects.id = quotations.project_id
      AND boq_projects.user_id = auth.uid()
  )
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_quotations_updated_at ON quotations;

CREATE TRIGGER trigger_update_quotations_updated_at
BEFORE UPDATE ON quotations
FOR EACH ROW
EXECUTE FUNCTION update_quotations_updated_at();
