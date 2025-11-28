import { Card } from '../types/board';
import { Edit2, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CardComponentProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

const priorityColors = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export function CardComponent({ card, onEdit, onDelete }: CardComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${card.title}"?`)) {
      onDelete(card.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(card)}
      className={`bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 border-l-4 border-l-purple-600 dark:border-l-purple-500 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group ${isDragging ? 'shadow-lg' : ''
        }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-slate-900 dark:text-white flex-1">
          {card.title}
        </h4>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {card.description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
          {card.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        {card.priority && card.priority in priorityColors && (
          <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[card.priority as keyof typeof priorityColors]}`}>
            {card.priority}
          </span>
        )}
        <div className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          <Edit2 size={12} />
        </div>
      </div>
    </div>
  );
}
