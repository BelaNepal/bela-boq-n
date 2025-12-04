-- Add user_id to boq_projects to track who created each BOQ
ALTER TABLE public.boq_projects ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing BOQs to have no owner (or you can set a default admin user)
-- Leaving them NULL for now, future BOQs will have proper ownership

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all operations on boq_projects" ON public.boq_projects;
DROP POLICY IF EXISTS "Users can create BOQ projects" ON public.boq_projects;
DROP POLICY IF EXISTS "Users can view their own BOQ projects" ON public.boq_projects;

-- Create new RLS policies
-- Users can view their own BOQs
CREATE POLICY "Users can view own boqs"
ON public.boq_projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create BOQs (will be owned by them)
CREATE POLICY "Users can create boqs"
ON public.boq_projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own BOQs
CREATE POLICY "Users can update own boqs"
ON public.boq_projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own BOQs
CREATE POLICY "Users can delete own boqs"
ON public.boq_projects
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all boqs"
ON public.boq_projects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);