import { Router, Response } from 'express';
import { AuthRequest, ensureAuth } from '../middleware/ensureAuth';
import { createClient } from '@supabase/supabase-js';
import { obfuscateKey } from '../utils/obfuscate';

const router = Router();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/settings - Get user's API keys (obfuscated)
router.get('/', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get the user's token from the Authorization header
    const token = req.headers.authorization?.substring(7); // Remove 'Bearer '

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create Supabase client with user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Fetch user settings
    const { data, error } = await supabase
      .from('user_settings')
      .select('openai_key, anthropic_key, gemini_api_key')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - it's ok if no settings exist yet
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    // Return obfuscated keys
    return res.json({
      openai_key: data ? obfuscateKey(data.openai_key) : '',
      anthropic_key: data ? obfuscateKey(data.anthropic_key) : '',
      gemini_api_key: data ? obfuscateKey(data.gemini_api_key) : '',
    });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings - Save user's API keys
router.post('/', ensureAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get the user's token from the Authorization header
    const token = req.headers.authorization?.substring(7); // Remove 'Bearer '

    if (!userId || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { openai_key, anthropic_key, gemini_api_key } = req.body;

    // Create Supabase client with user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // First, fetch existing settings
    const { data: existingData } = await supabase
      .from('user_settings')
      .select('openai_key, anthropic_key, gemini_api_key')
      .eq('user_id', userId)
      .single();

    // Build update object, preserving existing values for keys not being updated
    const updateData: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Only update openai_key if it's provided in the request
    if (openai_key !== undefined) {
      updateData.openai_key = openai_key || null;
    } else if (existingData?.openai_key) {
      updateData.openai_key = existingData.openai_key;
    }

    // Only update anthropic_key if it's provided in the request
    if (anthropic_key !== undefined) {
      updateData.anthropic_key = anthropic_key || null;
    } else if (existingData?.anthropic_key) {
      updateData.anthropic_key = existingData.anthropic_key;
    }

    // Only update gemini_api_key if it's provided in the request
    if (gemini_api_key !== undefined) {
      updateData.gemini_api_key = gemini_api_key || null;
    } else if (existingData?.gemini_api_key) {
      updateData.gemini_api_key = existingData.gemini_api_key;
    }

    // Upsert user settings
    const { error } = await supabase
      .from('user_settings')
      .upsert(updateData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving settings:', error);
      return res.status(500).json({ error: 'Failed to save settings' });
    }

    // Return obfuscated versions of the keys that were updated
    const response: any = {
      message: 'Settings saved successfully',
    };

    if (openai_key !== undefined) {
      response.openai_key = obfuscateKey(openai_key);
    }

    if (anthropic_key !== undefined) {
      response.anthropic_key = obfuscateKey(anthropic_key);
    }

    if (gemini_api_key !== undefined) {
      response.gemini_api_key = obfuscateKey(gemini_api_key);
    }

    return res.json(response);
  } catch (error) {
    console.error('Error in POST /api/settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
