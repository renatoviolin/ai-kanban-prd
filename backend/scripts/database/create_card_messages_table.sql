-- Create table for card messages (chat history)
CREATE TABLE IF NOT EXISTS card_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_card_messages_card_id ON card_messages(card_id);
CREATE INDEX idx_card_messages_created_at ON card_messages(created_at);

-- Enable Row Level Security
ALTER TABLE card_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages from their own cards
CREATE POLICY "Users can view their own card messages"
  ON card_messages FOR SELECT
  USING (
    card_id IN (
      SELECT id FROM cards WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can insert messages to their own cards
CREATE POLICY "Users can insert their own card messages"
  ON card_messages FOR INSERT
  WITH CHECK (
    card_id IN (
      SELECT id FROM cards WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can delete messages from their own cards
CREATE POLICY "Users can delete their own card messages"
  ON card_messages FOR DELETE
  USING (
    card_id IN (
      SELECT id FROM cards WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );
