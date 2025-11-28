import { Router, Response } from 'express';
import { AuthRequest, ensureAuth } from '../middleware/ensureAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/projects - List all user's projects
router.get('/', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    return res.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects - Create new project
router.post('/', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, tech_stack, context_rules, file_structure } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description || null,
        tech_stack: tech_stack || null,
        context_rules: context_rules || null,
        file_structure: file_structure || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return res.status(500).json({ error: 'Failed to create project' });
    }

    // Auto-create default columns
    const defaultColumns = [
      { project_id: data.id, title: 'To Do', order: 1 },
      { project_id: data.id, title: 'In Progress', order: 2 },
      { project_id: data.id, title: 'Done', order: 3 },
    ];

    const { error: columnsError } = await supabase
      .from('columns')
      .insert(defaultColumns);

    if (columnsError) {
      console.error('Error creating default columns:', columnsError);
      // Don't fail the request, columns can be created manually
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const projectId = req.params.id;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Project not found' });
      }
      console.error('Error fetching project:', error);
      return res.status(500).json({ error: 'Failed to fetch project' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in GET /api/projects/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const projectId = req.params.id;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, tech_stack, context_rules, file_structure } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        description: description || null,
        tech_stack: tech_stack || null,
        context_rules: context_rules || null,
        file_structure: file_structure || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ error: 'Failed to update project' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in PUT /api/projects/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const projectId = req.params.id;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting project:', error);
      return res.status(500).json({ error: 'Failed to delete project' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /api/projects/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
