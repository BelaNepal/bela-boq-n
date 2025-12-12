-- Create bela customer-info projects table
CREATE TABLE public.customer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  date DATE NOT NULL,

  province TEXT,
  district TEXT,
  municipality TEXT,
  ward TEXT,
  street TEXT,
  house_no TEXT,

  project_type TEXT,
  project_type_other TEXT,

  land_area TEXT,
  square_footage TEXT,
  project_scope TEXT,
  completion_date DATE,
  vision TEXT,

  storeys TEXT,
  storeys_other TEXT,
  site_topography TEXT,
  water_drainage TEXT,
  direction TEXT,
  additional_site_info TEXT,

  num_rooms TEXT,
  road_access_size TEXT,
  road_type TEXT[], -- Array of strings
  road_type_other TEXT,

  rooms JSONB, -- storing room details as JSON
  additional_spaces TEXT,

  accessibility TEXT,
  other_details TEXT,
  heard_from TEXT[], -- Array of strings
  attachments TEXT[], -- Array of file URLs

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_projects ENABLE ROW LEVEL SECURITY;

-- Allow all operations (MVP: adjust later)
CREATE POLICY "Allow all operations on customer_projects"
ON public.customer_projects
FOR ALL
USING (true)
WITH CHECK (true);
