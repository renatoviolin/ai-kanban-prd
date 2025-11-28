import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ensureAuth } from './middleware/ensureAuth';
import settingsRouter from './routes/settings';
import projectsRouter from './routes/projects';
import boardRouter from './routes/board';
import aiRouter from './routes/ai';
import prdTemplatesRouter from './routes/prdTemplates';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'kanban-ia-backend'
  });
});

// Protected endpoint - Get current user
app.get('/api/auth/me', ensureAuth, (req: Request, res: Response) => {
  res.json({
    user: req.user,
    message: 'Authentication successful'
  });
});

// Settings routes
app.use('/api/settings', settingsRouter);

// Projects routes
app.use('/api/projects', projectsRouter);

// Board routes (must come after project routes to avoid conflicts)
app.use('/api/projects', boardRouter);

// AI routes
app.use('/api/ai', aiRouter);

// PRD Templates routes
app.use('/api/prd-templates', prdTemplatesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`✅ Health check available at http://localhost:${PORT}/api/health`);
});
