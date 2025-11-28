import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Sparkles } from 'lucide-react';
import { BoardData, Card, FeatureSuggestion } from '../types/board';
import { Column } from '../components/Column';
import { CardModal } from '../components/CardModal';
import { AISuggestionModal } from '../components/AISuggestionModal';
import { Header } from '../components/Header';
import { Toast } from '../components/Toast';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { CardComponent } from '../components/Card';
import { arrayMove } from '@dnd-kit/sortable';

export function Board() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadBoard();
  }, [id, session]);

  const loadBoard = async () => {
    if (!session?.access_token || !id) return;

    try {
      const response = await fetch(`/api/projects/${id}/board`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBoardData(data);
      } else if (response.status === 404) {
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error loading board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCardById(active.id as string);
    setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over || !boardData) {
      setActiveColumnId(null);
      return;
    }

    const overColumnId = over.id as string;
    let targetColumn = boardData.columns.find(col => col.id === overColumnId);

    // If over a card, get its column
    if (!targetColumn) {
      const overCard = findCardById(overColumnId);
      if (overCard) {
        targetColumn = boardData.columns.find(col => col.id === overCard.column_id);
      }
    }

    setActiveColumnId(targetColumn?.id || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumnId(null);

    if (!over || !boardData) return;

    const activeCardId = active.id as string;
    const activeCard = findCardById(activeCardId);
    if (!activeCard) return;

    // Determine if dropped over a column or a card
    const overColumnId = over.id as string;
    let targetColumn = boardData.columns.find(col => col.id === overColumnId);

    // If dropped over a card, get its column
    if (!targetColumn) {
      const overCard = findCardById(overColumnId);
      if (overCard) {
        targetColumn = boardData.columns.find(col => col.id === overCard.column_id);
      }
    }

    if (!targetColumn) return;

    const sourceColumn = boardData.columns.find(col => col.id === activeCard.column_id);
    if (!sourceColumn) return;

    // Save old state for rollback
    const oldBoardData = { ...boardData };

    // Calculate new order
    let newOrder: number;
    const targetCards = targetColumn.cards || [];

    if (sourceColumn.id === targetColumn.id) {
      // Moving within same column
      const oldIndex = sourceColumn.cards?.findIndex(c => c.id === activeCardId) ?? -1;
      const newIndex = targetCards.findIndex(c => c.id === overColumnId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedCards = arrayMove(sourceColumn.cards || [], oldIndex, newIndex);
        newOrder = newIndex + 1;

        // Update UI optimistically
        const newColumns = boardData.columns.map(col => {
          if (col.id === sourceColumn.id) {
            return { ...col, cards: reorderedCards.map((c, idx) => ({ ...c, order: idx + 1 })) };
          }
          return col;
        });
        setBoardData({ columns: newColumns });
      } else {
        return; // No change needed
      }
    } else {
      // Moving to different column
      newOrder = targetCards.length + 1;

      // Update UI optimistically
      const newColumns = boardData.columns.map(col => {
        if (col.id === sourceColumn.id) {
          return { ...col, cards: col.cards?.filter(c => c.id !== activeCardId) };
        }
        if (col.id === targetColumn.id) {
          return { ...col, cards: [...(col.cards || []), { ...activeCard, column_id: targetColumn.id, order: newOrder }] };
        }
        return col;
      });
      setBoardData({ columns: newColumns });
    }

    // Persist to backend
    try {
      const response = await fetch(`/api/projects/cards/${activeCardId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          column_id: targetColumn.id,
          order: newOrder,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setBoardData(oldBoardData);
        setMessage({ type: 'error', text: 'Failed to move card. Please try again.' });
      }
    } catch (error) {
      // Revert on error
      setBoardData(oldBoardData);
      setMessage({ type: 'error', text: 'An error occurred while moving the card.' });
      console.error('Error moving card:', error);
    }
  };

  const findCardById = (cardId: string): Card | null => {
    if (!boardData) return null;
    for (const column of boardData.columns) {
      const card = column.cards?.find(c => c.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const handleSaveCard = async (cardData: Partial<Card>) => {
    setSaving(true);
    setMessage(null);

    try {
      if (editingCard) {
        // Update existing card
        const response = await fetch(`/api/projects/cards/${editingCard.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(cardData),
        });

        if (response.ok) {
          setMessage({ type: 'success', text: 'Card updated successfully!' });
          setIsModalOpen(false);
          setEditingCard(null);
          loadBoard();
        } else {
          setMessage({ type: 'error', text: 'Failed to update card.' });
        }
      } else {
        // Create new card
        const response = await fetch('/api/projects/cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            ...cardData,
            project_id: id,
          }),
        });

        if (response.ok) {
          setMessage({ type: 'success', text: 'Card created successfully!' });
          setIsModalOpen(false);
          loadBoard();
        } else {
          setMessage({ type: 'error', text: 'Failed to create card.' });
        }
      }
    } catch (error) {
      console.error('Error saving card:', error);
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/projects/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Card deleted successfully!' });
        loadBoard();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete card.' });
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      setMessage({ type: 'error', text: 'An error occurred.' });
    }
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleNewCard = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const handleAIAddCards = async (suggestions: FeatureSuggestion[]) => {
    setSaving(true);
    setMessage(null);

    try {
      // Add cards sequentially
      for (const suggestion of suggestions) {
        const response = await fetch('/api/projects/cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            title: suggestion.title,
            description: suggestion.description,
            priority: suggestion.priority,
            project_id: id,
            column_id: boardData?.columns[0]?.id // Add to first column
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create card');
        }
      }

      setMessage({ type: 'success', text: `Successfully added ${suggestions.length} cards!` });
      loadBoard();
    } catch (error) {
      console.error('Error adding AI cards:', error);
      setMessage({ type: 'error', text: 'Failed to add some cards.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading board...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Link to={`/projects/${id}`} className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                  <ArrowLeft size={16} />
                  Back to Project
                </Link>
              </div>
              {message && (
                <Toast
                  message={message.text}
                  type={message.type}
                  onClose={() => setMessage(null)}
                />
              )}

              <div className="mb-4 flex justify-end gap-3">
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                  <Sparkles size={20} />
                  AI Suggest
                </button>
                <button
                  onClick={handleNewCard}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <Plus size={20} />
                  New Card
                </button>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-4">
                {boardData?.columns.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    onCardEdit={handleEditCard}
                    onCardDelete={handleDeleteCard}
                    isActive={activeColumnId === column.id}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        <DragOverlay>
          {activeCard ? (
            <CardComponent
              card={activeCard}
              onEdit={() => { }}
              onDelete={() => { }}
            />
          ) : null}
        </DragOverlay>

        <CardModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCard(null);
          }}
          onSave={handleSaveCard}
          card={editingCard}
          columns={boardData?.columns || []}
          loading={saving}
        />

        <AISuggestionModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onAddCards={handleAIAddCards}
          projectId={id || ''}
        />
      </div>
    </DndContext>
  );
}
