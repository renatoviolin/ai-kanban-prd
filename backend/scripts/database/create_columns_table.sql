-- Create columns table
CREATE TABLE IF NOT EXISTS public.columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view columns from their own projects
CREATE POLICY "Users can view own project columns"
  ON public.columns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = columns.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can insert columns to their own projects
CREATE POLICY "Users can insert own project columns"
  ON public.columns
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = columns.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can update columns from their own projects
CREATE POLICY "Users can update own project columns"
  ON public.columns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = columns.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can delete columns from their own projects
CREATE POLICY "Users can delete own project columns"
  ON public.columns
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = columns.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at on columns updates
DROP TRIGGER IF EXISTS on_columns_updated ON public.columns;
CREATE TRIGGER on_columns_updated
  BEFORE UPDATE ON public.columns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
