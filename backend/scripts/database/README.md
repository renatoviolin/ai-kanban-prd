# Database Setup Instructions

## Run these SQL scripts in Supabase SQL Editor

### Order of Execution:

1. **create_profiles_table.sql** - User profiles (already done if authentication works)
2. **create_user_settings_table.sql** - API keys storage
3. **create_projects_table.sql** - Projects/workspaces
4. **create_columns_table.sql** - Kanban columns
5. **create_cards_table.sql** - Kanban cards
6. **create_card_messages_table.sql** - AI chat history
7. **update_for_ai.sql** - Add Gemini API key and generated_prd columns

### Steps:
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of each SQL file (in order)
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Repeat for each file

### What these scripts do:
- **profiles**: User profile information with RLS
- **user_settings**: Stores API keys (OpenAI, Anthropic, Gemini) with RLS
- **projects**: Project/workspace management with tech stack and context
- **columns**: Kanban board columns
- **cards**: Kanban cards with descriptions, priority, and generated PRDs
- **card_messages**: AI chat conversation history
- **update_for_ai**: Adds Gemini support and PRD storage

After running all scripts, the complete system will be functional.
