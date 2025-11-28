import { Router, Response } from 'express';
import { AuthRequest, ensureAuth } from '../middleware/ensureAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/projects/:id/board - Get board with columns and cards
router.get('/:id/board', ensureAuth, async (req: AuthRequest, res: Response) => {
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

    // First, verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get columns with their cards
    const { data: columns, error: columnsError } = await supabase
      .from('columns')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return res.status(500).json({ error: 'Failed to fetch board' });
    }

    // Get all cards for the project
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return res.status(500).json({ error: 'Failed to fetch cards' });
    }

    // Nest cards within columns
    const columnsWithCards = (columns || []).map(column => ({
      ...column,
      cards: (cards || []).filter(card => card.column_id === column.id)
    }));

    return res.json({ columns: columnsWithCards });
  } catch (error) {
    console.error('Error in GET /api/projects/:id/board:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cards/:id - Get single card
router.get('/cards/:id', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const cardId = req.params.id;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error) {
      console.error('Error fetching card:', error);
      return res.status(404).json({ error: 'Card not found' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in GET /api/cards/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cards - Create new card
router.post('/cards', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { project_id, column_id, title, description, priority } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Card title is required' });
    }

    if (!project_id || !column_id) {
      return res.status(400).json({ error: 'Project ID and Column ID are required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the highest order number in the column
    const { data: lastCard } = await supabase
      .from('cards')
      .select('order')
      .eq('column_id', column_id)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = lastCard ? lastCard.order + 1 : 1;

    const { data, error } = await supabase
      .from('cards')
      .insert({
        project_id,
        column_id,
        title: title.trim(),
        description: description || null,
        priority: priority || null,
        order: newOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating card:', error);
      return res.status(500).json({ error: 'Failed to create card' });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error in POST /api/cards:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/cards/:id - Update card
router.put('/cards/:id', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const cardId = req.params.id;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, priority, column_id, order } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Card title is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const updateData: any = {
      title: title.trim(),
      description: description || null,
      priority: priority || null,
      updated_at: new Date().toISOString(),
    };

    if (column_id !== undefined) {
      updateData.column_id = column_id;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    if (req.body.generated_prd !== undefined) {
      updateData.generated_prd = req.body.generated_prd;
    }

    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error updating card:', error);
      return res.status(500).json({ error: 'Failed to update card' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in PUT /api/cards/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/cards/:id/move - Move card to different column/position
router.patch('/cards/:id/move', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const cardId = req.params.id;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { column_id, order } = req.body;

    if (!column_id || order === undefined) {
      return res.status(400).json({ error: 'Column ID and order are required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Update the card's column and order
    const { data, error } = await supabase
      .from('cards')
      .update({
        column_id,
        order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error moving card:', error);
      return res.status(500).json({ error: 'Failed to move card' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/cards/:id/move:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cards/:id - Delete card
router.delete('/cards/:id', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.substring(7);
    const cardId = req.params.id;

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) {
      console.error('Error deleting card:', error);
      return res.status(500).json({ error: 'Failed to delete card' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /api/cards/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
