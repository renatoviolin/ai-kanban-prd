import { Column as ColumnType, Card } from '../types/board';
import { CardComponent } from './Card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface ColumnProps {
  column: ColumnType;
  onCardEdit: (card: Card) => void;
  onCardDelete: (cardId: string) => void;
  isActive?: boolean;
}

export function Column({ column, onCardEdit, onCardDelete, isActive = false }: ColumnProps) {
  const cardCount = column.cards?.length || 0;
  const cardIds = column.cards?.map(card => card.id) || [];

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-shrink-0 w-80 p-1">
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-lg p-4 transition-all ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 dark:bg-blue-900/20' : ''
        }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {column.title}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
            {cardCount}
          </span>
        </div>

        <div ref={setNodeRef} className="space-y-3 min-h-[50px]">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cardCount === 0 ? (
              <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm">
                No cards yet
              </div>
            ) : (
              column.cards!.map((card) => (
                <CardComponent
                  key={card.id}
                  card={card}
                  onEdit={onCardEdit}
                  onDelete={onCardDelete}
                />
              ))
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
