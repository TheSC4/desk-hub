import { useState } from 'react';
import { db, type Deck, type Card, type ReviewLog } from '../../db';
import { useLiveQuery } from '../../hooks/useLiveQuery';

interface DeckListProps {
  onStartReview: (deckId?: number) => void;
  onBrowse: () => void;
  onAddCard: (deckId?: number) => void;
  onOpenSettings: () => void;
}

export default function DeckList({
  onStartReview,
  onBrowse,
  onAddCard,
  onOpenSettings,
}: DeckListProps) {
  const decks = useLiveQuery(() => db.decks.toArray(), [], [] as Deck[]);
  const cards = useLiveQuery(() => db.cards.toArray(), [], [] as Card[]);
  const logs = useLiveQuery(() => db.reviewLogs.toArray(), [], [] as ReviewLog[]);

  const [newDeckName, setNewDeckName] = useState('');
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<{ id: number; name: string } | null>(null);

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Stats calculation
  const totalCards = cards.length;
  const totalDue = cards.filter((c) => c.dueDate <= now).length;
  const cardsReviewedToday = logs.filter((l) => l.reviewedAt >= startOfToday.getTime()).length;

  // Streak calculation (consecutive days with at least 1 review)
  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    const reviewDays = new Set(
      logs.map((l) => {
        const d = new Date(l.reviewedAt);
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      })
    );

    let streak = 0;
    const checkDate = new Date();
    // Check if reviewed today or yesterday to maintain active streak
    const todayStr = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    if (!reviewDays.has(todayStr)) {
      // Check yesterday before breaking streak
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
      if (!reviewDays.has(yesterdayStr)) {
        return 0;
      }
    }

    while (true) {
      const dStr = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
      if (reviewDays.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    await db.decks.add({
      name: newDeckName.trim(),
      createdAt: Date.now(),
    });
    setNewDeckName('');
    setShowNewDeckModal(false);
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this deck and all its flashcards?')) return;
    await db.transaction('rw', db.decks, db.cards, async () => {
      await db.cards.where('deckId').equals(deckId).delete();
      await db.decks.delete(deckId);
    });
  };

  const handleUpdateDeck = async () => {
    if (editingDeck && editingDeck.name.trim()) {
      await db.decks.update(editingDeck.id, { name: editingDeck.name.trim() });
    }
    setEditingDeck(null);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Top action & stats strip */}
      <div className="flex items-center justify-between pb-5 border-b border-border shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text">Spaced Repetition Flashcards</h1>
          <p className="text-sm text-text-muted">Master your GATE CSE core concepts with SM-2 scheduling</p>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onOpenSettings} className="btn-secondary !min-h-[44px] !px-4 text-xs font-medium">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Backup / Data
          </button>
          <button onClick={onBrowse} className="btn-secondary !min-h-[44px] !px-4 text-xs font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse All ({totalCards})
          </button>
          <button onClick={() => onAddCard()} className="btn-primary !min-h-[44px] !px-4 text-xs font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Card
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-4 my-5 shrink-0">
        <div className="card !p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-text-muted font-medium">Daily Streak</span>
            <p className="text-2xl font-bold text-warning flex items-center gap-1.5 mt-0.5">
              <span>{streak}</span>
              <span className="text-sm font-normal text-text-muted">day{streak !== 1 ? 's' : ''} 🔥</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning font-bold">
            ⚡
          </div>
        </div>

        <div className="card !p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-text-muted font-medium">Reviewed Today</span>
            <p className="text-2xl font-bold text-success mt-0.5">
              {cardsReviewedToday} <span className="text-sm font-normal text-text-muted">cards</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success font-bold">
            ✓
          </div>
        </div>

        <div className="card !p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-text-muted font-medium">Due for Review</span>
            <p className="text-2xl font-bold text-accent mt-0.5">
              {totalDue} <span className="text-sm font-normal text-text-muted">cards</span>
            </p>
          </div>
          <button
            onClick={() => onStartReview()}
            disabled={totalDue === 0}
            className="btn-primary !min-h-[40px] !px-4 text-xs disabled:opacity-40"
          >
            Review All Due
          </button>
        </div>
      </div>

      {/* Deck Header & Action */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-base font-semibold text-text">Decks & Subjects</h2>
        <button
          onClick={() => setShowNewDeckModal(true)}
          className="btn-ghost !min-h-[36px] !px-3 text-xs gap-1.5 text-accent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Deck
        </button>
      </div>

      {/* Decks Grid */}
      <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-3 gap-4 scrollbar-thin">
        {decks.length === 0 ? (
          <div className="col-span-3 card flex flex-col items-center justify-center py-12 text-center">
            <p className="text-text-muted text-sm mb-3">No decks found yet.</p>
            <button onClick={() => setShowNewDeckModal(true)} className="btn-primary text-xs">
              Create your first deck
            </button>
          </div>
        ) : (
          decks.map((deck) => {
            const deckCards = cards.filter((c) => c.deckId === deck.id);
            const dueCards = deckCards.filter((c) => c.dueDate <= now);
            const newCards = deckCards.filter((c) => c.repetitions === 0);

            return (
              <div
                key={deck.id}
                className="card flex flex-col justify-between hover:border-accent/40 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {editingDeck && editingDeck.id === deck.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingDeck.name}
                          onChange={(e) => setEditingDeck({ ...editingDeck, name: e.target.value })}
                          className="input !py-1 !px-2 !min-h-[32px] text-xs flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateDeck();
                            if (e.key === 'Escape') setEditingDeck(null);
                          }}
                        />
                        <button onClick={handleUpdateDeck} className="text-xs text-accent font-semibold px-1">
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-text text-base truncate flex-1">{deck.name}</h3>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => deck.id && setEditingDeck({ id: deck.id, name: deck.name })}
                        className="p-1 text-text-muted hover:text-text rounded"
                        title="Rename deck"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => deck.id && handleDeleteDeck(e, deck.id)}
                        className="p-1 text-text-muted hover:text-danger rounded"
                        title="Delete deck"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Card counts */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-light/50 border border-border/50 text-center mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-accent">Due</span>
                      <p className="text-base font-bold text-text tabular-nums">{dueCards.length}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-warning">New</span>
                      <p className="text-base font-bold text-text tabular-nums">{newCards.length}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-text-muted">Total</span>
                      <p className="text-base font-bold text-text tabular-nums">{deckCards.length}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <button
                    onClick={() => onStartReview(deck.id)}
                    disabled={dueCards.length === 0}
                    className="btn-primary flex-1 !min-h-[40px] text-xs font-semibold disabled:opacity-40"
                  >
                    Start Revision
                  </button>
                  <button
                    onClick={() => onAddCard(deck.id)}
                    className="btn-secondary !min-h-[40px] !px-3 text-xs"
                    title="Add card to this deck"
                  >
                    + Card
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Deck Modal */}
      {showNewDeckModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="text-base font-semibold text-text">Create Deck</h3>
            <form onSubmit={handleCreateDeck} className="space-y-4">
              <input
                type="text"
                placeholder="Deck name (e.g. Algorithms & DS)..."
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="input text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewDeckModal(false)}
                  className="btn-ghost text-xs !min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDeckName.trim()}
                  className="btn-primary text-xs !min-h-[40px] disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
