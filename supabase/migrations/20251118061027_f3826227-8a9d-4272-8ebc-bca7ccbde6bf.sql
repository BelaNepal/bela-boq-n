-- Allow admins to manage predefined_items
CREATE POLICY "Admins can manage predefined items"
ON predefined_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Update RLS policies for admin to manage BOQ projects and work items
CREATE POLICY "Admins can manage all BOQ projects"
ON boq_projects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Grant authenticated users to create their own BOQs
CREATE POLICY "Users can create BOQ projects"
ON boq_projects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own BOQ projects"
ON boq_projects
FOR SELECT
USING (auth.uid() IS NOT NULL);