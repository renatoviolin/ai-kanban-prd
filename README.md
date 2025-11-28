# AI-Kanban

AI-powered Kanban board with intelligent task management and automated PRD (Product Requirements Document) generation.

## Features

- 🎯 **Smart Kanban Board**: Organize tasks with drag-and-drop functionality
- 🤖 **AI-Powered PRD Generation**: Automatically generate technical PRDs using OpenAI, Anthropic, or Google Gemini
- 📝 **Customizable Templates**: Create and manage your own PRD templates
- 🔐 **Secure Authentication**: Built on Supabase for robust user management
- 🎨 **Modern UI**: Built with React, TypeScript, and TailwindCSS

## Tech Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS, ShadCN/UI
- **Backend:** Node.js, Express, TypeScript
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Integration:** OpenAI API (GPT-4o), Anthropic (Claude 3.5), Google Gemini

## Prerequisites

- Node.js 18 or higher
- A Supabase account ([sign up here](https://supabase.com))
- At least one AI provider API key:
  - OpenAI API key ([get one here](https://platform.openai.com/api-keys))
  - Anthropic API key ([get one here](https://console.anthropic.com/))
  - Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/kanban-ia.git
cd kanban-ia
```

### 2. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for both the frontend and backend.

### 3. Configure Environment Variables

#### Backend Configuration

1. Copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Open `backend/.env` and fill in your credentials:
   ```env
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Server Configuration (optional)
   PORT=3001
   ```

**Where to find your credentials:**
- **Supabase**: Go to your [Supabase Dashboard](https://app.supabase.com) → Select your project → Settings → API

#### Frontend Configuration

1. Copy the example environment file:
   ```bash
   cd ../frontend
   cp .env.example .env
   ```

2. Open `frontend/.env` (the default values should work for local development):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

### 4. Set Up Supabase Database

You'll need to create the necessary tables in your Supabase database. You can find the SQL scripts in the `backend/scripts/database` directory.

Run these scripts in your Supabase SQL Editor in the following order:
1. `create_profiles_table.sql`
2. `create_projects_table.sql`
3. `create_columns_table.sql`
4. `create_cards_table.sql`
5. `create_user_settings_table.sql`
6. `create_prp_templates_table.sql`
7. `add_ai_generated_to_cards.sql`
8. `create_card_messages_table.sql`

> **Note**: You can copy the content of these files and paste them into the SQL Editor in your Supabase dashboard.

### 5. Run the Application

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend server on `http://localhost:5173`

### 6. Verify Installation

Open your browser and navigate to `http://localhost:5173`. You should see:
- The login/signup page
- A health check status confirming the backend connection

## Usage

### Creating Your First Project

1. Sign up or log in to your account
2. Click "New Project" on the dashboard
3. Create columns for your Kanban board (e.g., "To Do", "In Progress", "Done")
4. Add cards to your board

### Generating a PRD

1. Click on any card in your Kanban board
2. Navigate to the "AI Assistant" tab
3. Select your preferred AI provider (or use "Auto" for fallback)
4. Click "Generate PRD"
5. The AI will analyze your card and may ask clarifying questions
6. Once complete, you'll receive a detailed technical PRD

### Creating Custom PRD Templates

1. Navigate to "PRD Templates" from the dashboard
2. Click "New Template"
3. Define your template structure
4. Use the template when generating PRDs for consistent formatting

## Configuration

### AI Provider Selection

The application supports three AI providers with automatic fallback:

1. **Auto Mode** (Recommended): Tries providers in order: Gemini → OpenAI → Anthropic
2. **OpenAI (GPT-4o)**: Most reliable, best for detailed technical documentation
3. **Anthropic (Claude 3.5)**: Excellent for structured output
4. **Google Gemini**: Fast and cost-effective

You can configure your API keys in the application **Settings** page. No environment variables are required for AI models.

### Environment Variables Reference

#### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key |
| `PORT` | No | Backend server port (default: 3001) |

#### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL (default: http://localhost:3001) |

## Troubleshooting

### Backend won't start

1. Verify all required environment variables are set in `backend/.env`
2. Check that Supabase credentials are correct
3. Ensure port 3001 is not already in use

### Frontend can't connect to backend

1. Verify the backend is running on the expected port
2. Check `frontend/.env` has the correct `VITE_API_URL`
3. Look for CORS errors in the browser console

### AI PRD generation fails

1. Verify you have configured at least one AI provider in the **Settings** page
2. Check API key validity and account credits
3. Review backend logs for detailed error messages

### Database connection issues

1. Confirm Supabase URL and anon key are correct
2. Check that your Supabase project is active
3. Verify your IP address is not blocked by Supabase

## Development

### Project Structure

```
ai-kanban/
├── backend/          # Express TypeScript backend
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth middleware
│   │   └── config/            # Configuration files
│   └── package.json
├── frontend/         # React Vite TypeScript frontend
│   ├── src/
│   │   ├── App.tsx            # Main app component
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   └── config/            # Configuration
│   └── package.json
└── package.json      # Root package with dev scripts
```

### Available Scripts

From the root directory:

- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production

From the backend directory:

- `npm run dev` - Start backend development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build

From the frontend directory:

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build

### Development Notes

- The frontend proxies `/api/*` requests to the backend automatically
- Both servers support hot-reload during development
- TypeScript is configured with strict mode for type safety

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Supabase](https://supabase.com) for backend infrastructure
- AI powered by [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), and [Google Gemini](https://ai.google.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

## Support

If you encounter any issues or have questions:
- Open an issue on [GitHub Issues](https://github.com/YOUR_USERNAME/kanban-ia/issues)
- Check the [Troubleshooting](#troubleshooting) section above

---

Made with ❤️ by the AI-Kanban team
