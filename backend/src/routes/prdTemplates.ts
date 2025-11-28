import { Router, Response } from 'express';
import { AuthRequest, ensureAuth } from '../middleware/ensureAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/prd-templates - Get all PRD templates
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
      .from('prd_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching PRD templates:', error);
      return res.status(500).json({ error: 'Failed to fetch PRD templates' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in GET /api/prd-templates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/prd-templates - Create a new PRD template
router.post('/', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { template_name, content } = req.body;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!template_name || !template_name.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Template content is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await supabase
      .from('prd_templates')
      .insert({ template_name, content })
      .select()
      .single();

    if (error) {
      console.error('Error creating PRD template:', error);
      return res.status(500).json({ error: 'Failed to create PRD template' });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error in POST /api/prd-templates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/prd-templates/:id - Update a PRD template
router.put('/:id', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { id } = req.params;
    const { template_name, content } = req.body;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!template_name || !template_name.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Template content is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await supabase
      .from('prd_templates')
      .update({ template_name, content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating PRD template:', error);
      return res.status(500).json({ error: 'Failed to update PRD template' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in PUT /api/prd-templates/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/prd-templates/:id - Delete a PRD template
router.delete('/:id', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const { id } = req.params;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { error } = await supabase
      .from('prd_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting PRD template:', error);
      return res.status(500).json({ error: 'Failed to delete PRD template' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /api/prd-templates/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
