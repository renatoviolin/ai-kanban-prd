-- Create prd_templates table
CREATE TABLE IF NOT EXISTS prd_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on template_name
CREATE INDEX IF NOT EXISTS idx_prd_templates_name ON prd_templates(template_name);
