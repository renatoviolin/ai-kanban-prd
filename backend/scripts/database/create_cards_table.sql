-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view cards from their own projects
CREATE POLICY "Users can view own project cards"
  ON public.cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = cards.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can insert cards to their own projects
CREATE POLICY "Users can insert own project cards"
  ON public.cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = cards.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can update cards from their own projects
CREATE POLICY "Users can update own project cards"
  ON public.cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = cards.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can delete cards from their own projects
CREATE POLICY "Users can delete own project cards"
  ON public.cards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = cards.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at on cards updates
DROP TRIGGER IF EXISTS on_cards_updated ON public.cards;
CREATE TRIGGER on_cards_updated
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
