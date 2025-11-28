export interface Column {
  id: string;
  project_id: string;
  title: string;
  order: number;
  created_at: string;
  updated_at: string;
  cards?: Card[];
}

export interface Card {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string | null;
  order: number;
  priority: string | null;
  created_at: string;
  updated_at: string;
  generated_prd?: string;
  ai_generated?: boolean;
}

export interface BoardData {
  columns: Column[];
}

export interface FeatureSuggestion {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
}
