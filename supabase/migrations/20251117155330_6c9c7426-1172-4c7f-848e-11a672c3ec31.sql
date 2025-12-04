-- Create BOQ projects table
CREATE TABLE public.boq_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create civil work - metal work table
CREATE TABLE public.civil_metal_work (
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

-- Create civil work - pcc work table
CREATE TABLE public.civil_pcc_work (
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

-- Create eco-panel work - panel floor table
CREATE TABLE public.panel_floor_work (
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

-- Create eco-panel work - panel roof table
CREATE TABLE public.panel_roof_work (
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

-- Create eco-panel work - panel wall table
CREATE TABLE public.panel_wall_work (
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

-- Create eco-panel work - upvc doors and windows table
CREATE TABLE public.upvc_doors_windows (
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

-- Create eco-panel work - toilet bath and plumbing table
CREATE TABLE public.toilet_bath_plumbing (
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

-- Create eco-panel work - wall putty table
CREATE TABLE public.wall_putty_work (
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

-- Create eco-panel work - electric work table
CREATE TABLE public.electric_work (
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

-- Create eco-panel work - roofing work table
CREATE TABLE public.roofing_work (
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

-- Enable RLS on all tables
ALTER TABLE public.boq_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civil_metal_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civil_pcc_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_floor_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_roof_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_wall_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvc_doors_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toilet_bath_plumbing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wall_putty_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electric_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_work ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for MVP, adjust as needed)
CREATE POLICY "Allow all operations on boq_projects" ON public.boq_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on civil_metal_work" ON public.civil_metal_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on civil_pcc_work" ON public.civil_pcc_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on panel_floor_work" ON public.panel_floor_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on panel_roof_work" ON public.panel_roof_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on panel_wall_work" ON public.panel_wall_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on upvc_doors_windows" ON public.upvc_doors_windows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on toilet_bath_plumbing" ON public.toilet_bath_plumbing FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on wall_putty_work" ON public.wall_putty_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on electric_work" ON public.electric_work FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on roofing_work" ON public.roofing_work FOR ALL USING (true) WITH CHECK (true);