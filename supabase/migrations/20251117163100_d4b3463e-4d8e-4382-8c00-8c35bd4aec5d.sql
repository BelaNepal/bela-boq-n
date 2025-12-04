-- Create predefined_items table for standard BOQ items with prices
CREATE TABLE public.predefined_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  specification TEXT,
  unit TEXT NOT NULL,
  standard_rate NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.predefined_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read predefined items
CREATE POLICY "Anyone can view predefined items" 
ON public.predefined_items 
FOR SELECT 
USING (true);

-- Insert standard items for each category
-- Civil Metal Work items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('civil_metal_work', 'Steel Column', 'MS Column 150x150mm', 'kg', 120.00),
('civil_metal_work', 'Steel Beam', 'MS Beam ISMB 200', 'kg', 115.00),
('civil_metal_work', 'Steel Truss', 'MS Truss fabricated', 'kg', 125.00),
('civil_metal_work', 'MS Angle', 'MS Angle 50x50x6mm', 'kg', 110.00),
('civil_metal_work', 'MS Plate', 'MS Plate 6mm thick', 'kg', 105.00);

-- Civil PCC Work items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('civil_pcc_work', 'PCC Foundation', 'M15 grade concrete', 'cum', 6500.00),
('civil_pcc_work', 'PCC Flooring', 'M20 grade concrete', 'sqm', 850.00),
('civil_pcc_work', 'RCC Column', 'M25 grade with reinforcement', 'cum', 12000.00),
('civil_pcc_work', 'RCC Beam', 'M25 grade with reinforcement', 'cum', 11500.00),
('civil_pcc_work', 'RCC Slab', 'M25 grade 150mm thick', 'sqm', 1250.00);

-- Panel Floor Work items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('panel_floor_work', 'Eco Panel Floor', 'Insulated panel 75mm', 'sqm', 2800.00),
('panel_floor_work', 'Eco Panel Floor', 'Insulated panel 100mm', 'sqm', 3200.00),
('panel_floor_work', 'Floor Accessories', 'Fixing materials', 'sqm', 250.00),
('panel_floor_work', 'Floor Finish', 'Epoxy coating', 'sqm', 450.00);

-- Panel Roof Work items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('panel_roof_work', 'Eco Panel Roof', 'Insulated panel 75mm', 'sqm', 2600.00),
('panel_roof_work', 'Eco Panel Roof', 'Insulated panel 100mm', 'sqm', 3000.00),
('panel_roof_work', 'Ridge Cap', 'Pre-painted GI', 'rmt', 850.00),
('panel_roof_work', 'Gutter', 'Pre-painted GI', 'rmt', 650.00);

-- Panel Wall Work items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('panel_wall_work', 'Eco Panel Wall', 'Insulated panel 50mm', 'sqm', 2400.00),
('panel_wall_work', 'Eco Panel Wall', 'Insulated panel 75mm', 'sqm', 2700.00),
('panel_wall_work', 'Corner Trim', 'Pre-painted GI', 'rmt', 450.00),
('panel_wall_work', 'Base Rail', 'MS section painted', 'rmt', 380.00);

-- UPVC Doors & Windows items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('upvc_doors_windows', 'UPVC Door', 'Single shutter with frame', 'nos', 18500.00),
('upvc_doors_windows', 'UPVC Door', 'Double shutter with frame', 'nos', 28000.00),
('upvc_doors_windows', 'UPVC Window', 'Sliding 4ft x 3ft', 'nos', 12000.00),
('upvc_doors_windows', 'UPVC Window', 'Casement 3ft x 4ft', 'nos', 9500.00);

-- Toilet Bath & Plumbing items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('toilet_bath_plumbing', 'WC Pan', 'European style with seat', 'nos', 8500.00),
('toilet_bath_plumbing', 'Wash Basin', 'Counter top ceramic', 'nos', 5500.00),
('toilet_bath_plumbing', 'CP Fittings', 'Basin mixer chrome plated', 'set', 4200.00),
('toilet_bath_plumbing', 'PVC Pipe', '110mm dia', 'rmt', 450.00),
('toilet_bath_plumbing', 'Water Tank', '500 ltr overhead', 'nos', 8500.00);

-- Wall Putty Work items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('wall_putty_work', 'Wall Putty', 'Acrylic based 2 coats', 'sqm', 180.00),
('wall_putty_work', 'Primer', 'Wall primer 1 coat', 'sqm', 65.00),
('wall_putty_work', 'Paint', 'Premium emulsion 2 coats', 'sqm', 240.00),
('wall_putty_work', 'Enamel Paint', 'Synthetic enamel 2 coats', 'sqm', 280.00);

-- Electric Work items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('electric_work', 'LED Light', '20W surface mounted', 'nos', 850.00),
('electric_work', 'Fan', 'Ceiling fan 1200mm', 'nos', 3200.00),
('electric_work', 'Switch Socket', '6A modular', 'nos', 250.00),
('electric_work', 'MCB Box', '8 way distribution board', 'nos', 4500.00),
('electric_work', 'Cable', '2.5 sq mm copper', 'rmt', 85.00);

-- Roofing Work items
INSERT INTO public.predefined_items (category, item_name, specification, unit, standard_rate) VALUES
('roofing_work', 'Metal Roofing', 'Pre-painted GI sheet 0.5mm', 'sqm', 850.00),
('roofing_work', 'Purlins', 'C section MS purlin', 'rmt', 380.00),
('roofing_work', 'Insulation', 'Rockwool 50mm', 'sqm', 450.00),
('roofing_work', 'Ventilator', 'Turbo ventilator 12 inch', 'nos', 3500.00);