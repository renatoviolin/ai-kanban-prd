-- Add RLS policies for prd_templates table
-- This allows authenticated users to manage their own templates

-- Enable RLS (if not already enabled)
ALTER TABLE prd_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view all templates
-- (Templates are shared across the organization/project)
CREATE POLICY "Allow authenticated users to view templates"
ON prd_templates
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow users to create templates
CREATE POLICY "Allow authenticated users to create templates"
ON prd_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow users to update templates
CREATE POLICY "Allow authenticated users to update templates"
ON prd_templates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow users to delete templates
CREATE POLICY "Allow authenticated users to delete templates"
ON prd_templates
FOR DELETE
TO authenticated
USING (true);
