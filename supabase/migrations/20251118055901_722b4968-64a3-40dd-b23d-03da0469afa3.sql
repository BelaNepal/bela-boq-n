-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy for users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for admins to manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add more sample predefined items with various units
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
-- Civil Metal Work (per piece, per kg, per meter)
('Civil Metal Work', 'MS Angle 50x50x6mm', 'Mild Steel Angle', 'Kg', 85.00),
('Civil Metal Work', 'MS Channel 100mm', 'Standard Channel', 'Kg', 90.00),
('Civil Metal Work', 'Gate Hinges Heavy Duty', '8 inch Heavy Duty', 'Pcs', 450.00),
('Civil Metal Work', 'Steel Pipe 2 inch', 'GI Pipe', 'Meter', 180.00),
('Civil Metal Work', 'Welding Rod 3.15mm', 'Standard Quality', 'Kg', 150.00),

-- Civil PCC Work (per cubic meter, per sqm)
('Civil PCC Work', 'PCC 1:3:6', 'Plain Cement Concrete', 'Cum', 6500.00),
('Civil PCC Work', 'PCC 1:2:4', 'Higher Grade PCC', 'Cum', 8200.00),
('Civil PCC Work', 'Sand Filling', 'River Sand', 'Cum', 1800.00),
('Civil PCC Work', 'Stone Aggregate 20mm', 'Crushed Stone', 'Cum', 2200.00),

-- Panel Floor Work (per sqm, per piece)
('Panel Floor Work', 'Eco Panel Floor 50mm', 'Insulated Panel', 'Sqm', 1200.00),
('Panel Floor Work', 'Eco Panel Floor 75mm', 'Heavy Duty Panel', 'Sqm', 1450.00),
('Panel Floor Work', 'Floor Panel Connector', 'Metal Connector', 'Pcs', 85.00),
('Panel Floor Work', 'Floor Sealant Tape', 'Waterproof Tape', 'Meter', 45.00),

-- Panel Roof Work (per sqm, per piece)
('Panel Roof Work', 'Eco Panel Roof 50mm', 'Weather Resistant', 'Sqm', 1350.00),
('Panel Roof Work', 'Eco Panel Roof 75mm', 'Premium Quality', 'Sqm', 1650.00),
('Panel Roof Work', 'Roof Ridge Cap', 'Metal Ridge', 'Pcs', 380.00),
('Panel Roof Work', 'Roof Fasteners Set', 'Stainless Steel', 'Set', 120.00),

-- Panel Wall Work (per sqm, per meter)
('Panel Wall Work', 'Eco Panel Wall 50mm', 'Standard Wall Panel', 'Sqm', 1250.00),
('Panel Wall Work', 'Eco Panel Wall 75mm', 'Heavy Duty Wall', 'Sqm', 1550.00),
('Panel Wall Work', 'Wall Panel Joint', 'Aluminum Joint', 'Meter', 95.00),
('Panel Wall Work', 'Corner Profile', 'Aluminum Corner', 'Meter', 125.00),

-- UPVC Doors & Windows (per sqft, per piece)
('UPVC Doors & Windows', 'UPVC Window 3x4 ft', 'Standard White', 'Sqft', 850.00),
('UPVC Doors & Windows', 'UPVC Door 3x7 ft', 'Standard Door', 'Sqft', 950.00),
('UPVC Doors & Windows', 'UPVC Sliding Window', 'Premium Quality', 'Sqft', 1100.00),
('UPVC Doors & Windows', 'Window Hardware Set', 'Complete Set', 'Set', 450.00),
('UPVC Doors & Windows', 'Door Lock Set', 'Heavy Duty Lock', 'Pcs', 1200.00),

-- Toilet Bath & Plumbing (per piece, per meter)
('Toilet Bath & Plumbing', 'Commode EWC', 'European Style', 'Pcs', 8500.00),
('Toilet Bath & Plumbing', 'Wash Basin', 'Wall Mounted', 'Pcs', 3200.00),
('Toilet Bath & Plumbing', 'Water Tap Chrome', 'Premium Finish', 'Pcs', 850.00),
('Toilet Bath & Plumbing', 'PVC Pipe 4 inch', 'Drainage Pipe', 'Meter', 180.00),
('Toilet Bath & Plumbing', 'Water Tank 500L', 'Overhead Tank', 'Pcs', 6500.00),

-- Wall Putty Work (per kg, per sqm)
('Wall Putty Work', 'Wall Putty White', 'Premium Quality', 'Kg', 65.00),
('Wall Putty Work', 'Primer Coating', 'Base Coat', 'Sqm', 45.00),
('Wall Putty Work', 'Texture Paint', 'Decorative Finish', 'Kg', 280.00),
('Wall Putty Work', 'Putty Application', 'Labour Charges', 'Sqm', 85.00),

-- Electric Work (per piece, per meter, per point)
('Electric Work', 'LED Light 20W', 'Energy Efficient', 'Pcs', 450.00),
('Electric Work', 'Switch Socket 5A', 'Standard Quality', 'Pcs', 85.00),
('Electric Work', 'MCB 32A', 'Circuit Breaker', 'Pcs', 380.00),
('Electric Work', 'Electric Wire 2.5sqmm', 'Copper Wire', 'Meter', 28.00),
('Electric Work', 'Distribution Board 8Way', 'Complete DB', 'Pcs', 2800.00),
('Electric Work', 'Ceiling Fan 48inch', 'Standard Fan', 'Pcs', 2200.00),
('Electric Work', 'Wiring Point', 'Complete Installation', 'Point', 650.00),

-- Roofing Work (per sqm, per piece, per kg)
('Roofing Work', 'GI Sheet 0.5mm', 'Galvanized Sheet', 'Sqm', 450.00),
('Roofing Work', 'Color Coated Sheet', 'Premium Finish', 'Sqm', 580.00),
('Roofing Work', 'Roof Purlin MS', 'Structural Steel', 'Kg', 88.00),
('Roofing Work', 'Ridge Ventilator', 'Aluminum Vent', 'Pcs', 1200.00),
('Roofing Work', 'Roofing Screw', 'Self Drilling', 'Pcs', 8.00);
