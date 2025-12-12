-- Create quotations table for storing quotation details
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES boq_projects(id) ON DELETE CASCADE,
  quotation_number VARCHAR(255) NOT NULL UNIQUE,
  quotation_date DATE NOT NULL,
  validity_days INTEGER DEFAULT 30,
  grand_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_quotations_project_id ON quotations(project_id);
CREATE INDEX idx_quotations_quotation_number ON quotations(quotation_number);
