CREATE TABLE IF NOT EXISTS public.civil_other_work (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.boq_projects(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  specification TEXT,
  unit TEXT NOT NULL,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(12,2),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eco_panel_other_work (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.boq_projects(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  specification TEXT,
  unit TEXT NOT NULL,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(12,2),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_field_work (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.boq_projects(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  specification TEXT,
  unit TEXT NOT NULL,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(12,2),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.civil_other_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_panel_other_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all operations on civil_other_work" ON public.civil_other_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on eco_panel_other_work" ON public.eco_panel_other_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on custom_field_work" ON public.custom_field_work FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.boq_projects
  ADD COLUMN IF NOT EXISTS site_location TEXT,
  ADD COLUMN IF NOT EXISTS built_up_area TEXT,
  ADD COLUMN IF NOT EXISTS start_date TEXT,
  ADD COLUMN IF NOT EXISTS completion_date TEXT,
  ADD COLUMN IF NOT EXISTS fiscal_year TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS overhead_percent DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS vat_percent DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS transportation_cost DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS custom_title TEXT;
