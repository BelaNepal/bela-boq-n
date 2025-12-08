--------------------------------------------------------------------
-- 0. ENUM + helper functions (recommended)
--------------------------------------------------------------------

-- USER ROLE ENUM (already exists, but safe to create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role'
  ) THEN
    CREATE TYPE app_role AS ENUM ('admin', 'editor', 'viewer');
  END IF;
END$$;

-- Helper: Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = has_role.user_id AND ur.role = has_role.role
  );
END;
$$ LANGUAGE plpgsql STABLE;

--------------------------------------------------------------------
-- 1. CREATE MASTER TABLE
--------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_master_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to project
  project_id UUID REFERENCES public.boq_projects(id) ON DELETE CASCADE,

  -- Identifiers
  sn INTEGER CHECK (sn >= 0),
  product_code TEXT NOT NULL CHECK (length(product_code) > 0),
  bela_prod_code TEXT,
  product_size TEXT,

  -- Dimensions (meters)
  t_mtr NUMERIC(10,3) CHECK (t_mtr >= 0),
  w_mtr NUMERIC(10,3) CHECK (w_mtr >= 0),
  l_mtr NUMERIC(10,3) CHECK (l_mtr >= 0),
  m3 NUMERIC(12,4) CHECK (m3 >= 0),

  -- Dimensions (feet)
  w_ft NUMERIC(10,3) CHECK (w_ft >= 0),
  l_ft NUMERIC(10,3) CHECK (l_ft >= 0),
  sqft NUMERIC(12,3) CHECK (sqft >= 0),

  -- Weight
  weight_kg NUMERIC(12,3) CHECK (weight_kg >= 0),

  -- Pricing
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 13 CHECK (vat_rate >= 0),
  price_with_vat NUMERIC(12,2),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--------------------------------------------------------------------
-- 2. INDEXES
--------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_specs_project
  ON public.product_master_specs(project_id);

CREATE INDEX IF NOT EXISTS idx_product_specs_code
  ON public.product_master_specs(product_code);

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_product_code
  ON public.product_master_specs(project_id, product_code);

--------------------------------------------------------------------
-- 3. TRIGGERS: updated_at + VAT auto-calc
--------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_product_master_specs_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();

  -- Auto VAT calculation
  IF NEW.base_price IS NOT NULL THEN
    NEW.price_with_vat = ROUND(NEW.base_price * (1 + NEW.vat_rate / 100), 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_master_specs_update ON public.product_master_specs;

CREATE TRIGGER trg_product_master_specs_update
BEFORE UPDATE ON public.product_master_specs
FOR EACH ROW EXECUTE FUNCTION public.trg_product_master_specs_update();

--------------------------------------------------------------------
-- 4. ENABLE RLS
--------------------------------------------------------------------
ALTER TABLE public.product_master_specs ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------
-- 5. RLS POLICY — Service Role (backend full access)
--------------------------------------------------------------------
CREATE POLICY "Service role full access"
ON public.product_master_specs
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

--------------------------------------------------------------------
-- 6. RLS POLICY — Admins (all access)
--------------------------------------------------------------------
CREATE POLICY "Admins full access"
ON public.product_master_specs
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

--------------------------------------------------------------------
-- 7. RLS POLICY — SELECT (Users can read their project products)
--------------------------------------------------------------------
CREATE POLICY "Users can SELECT own project products"
ON public.product_master_specs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.boq_projects p
    WHERE p.id = product_master_specs.project_id
      AND p.user_id = auth.uid()
  )
);

--------------------------------------------------------------------
-- 8. RLS POLICY — INSERT
--------------------------------------------------------------------
CREATE POLICY "Users INSERT only into their project"
ON public.product_master_specs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boq_projects p
    WHERE p.id = product_master_specs.project_id
      AND p.user_id = auth.uid()
  )
);

--------------------------------------------------------------------
-- 9. RLS POLICY — UPDATE
--------------------------------------------------------------------
CREATE POLICY "Users UPDATE own project products"
ON public.product_master_specs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.boq_projects p
    WHERE p.id = product_master_specs.project_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boq_projects p
    WHERE p.id = product_master_specs.project_id
      AND p.user_id = auth.uid()
  )
);

--------------------------------------------------------------------
-- 10. RLS POLICY — DELETE
--------------------------------------------------------------------
CREATE POLICY "Users DELETE own project products"
ON public.product_master_specs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.boq_projects p
    WHERE p.id = product_master_specs.project_id
      AND p.user_id = auth.uid()
  )
);

--------------------------------------------------------------------
-- 11. EXTRA SAFETY — Disallow public access entirely
--------------------------------------------------------------------
REVOKE ALL ON public.product_master_specs FROM public;

--------------------------------------------------------------------
-- DONE ✔ FULL TABLE + SECURITY + TRIGGERS + INDEXES
--------------------------------------------------------------------
