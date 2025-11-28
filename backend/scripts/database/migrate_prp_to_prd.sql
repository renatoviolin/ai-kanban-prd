-- Migration: Rename PRP to PRD
-- This script renames the old prp_templates table and generated_prp column to use PRD terminology

-- Step 1: Rename the table
ALTER TABLE prp_templates RENAME TO prd_templates;

-- Step 2: Rename the index
ALTER INDEX idx_prp_templates_name RENAME TO idx_prd_templates_name;

-- Step 3: Rename the generated_prp column in cards table to generated_prd
ALTER TABLE cards RENAME COLUMN generated_prp TO generated_prd;

-- Verification queries (optional - run these separately to verify)
-- SELECT * FROM prd_templates;
-- SELECT id, title, generated_prd FROM cards WHERE generated_prd IS NOT NULL;
