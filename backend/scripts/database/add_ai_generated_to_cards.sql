-- Add ai_generated column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;
