import { useState, useMemo } from 'react';
import { db, type Card, type Deck } from '../../db';
import { useLiveQuery } from '../../hooks/useLiveQuery';

interface CardBrowserProps {
  onBack: () => void;
  onEdit: (cardId: number) => void;
}

export default function CardBrowser({ onBack, onEdit }: CardBrowserProps) {
  const cards = useLiveQuery(() => db.cards.toArray(), [], [] as Card[]);
  const decks = useLiveQuery(() => db.decks.toArray(), [], [] as Deck[]);

  const [search, setSearch] = useState('');
  const [selectedDeckFilter, setSelectedDeckFilter] = useState<number | 'all'>('all');

  const deckMap = useMemo(() => {
    const map = new Map<number, string>();
    decks.forEach((d) => {
      if (d.id) map.set(d.id, d.name);
    });
    return map;
  }, [decks]);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (selectedDeckFilter !== 'all' && c.deckId !== selectedDeckFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q);
    });
  }, [cards, selectedDeckFilter, search]);

  const handleDeleteCard = async (id?: number) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this card?')) return;
    await db.cards.delete(id);
  };

  const formatDueDate = (ts: number) => {
    const diff = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Due now';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost !min-h-[38px] !px-2.5 text-xs text-text-muted hover:text-text">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-text">Browse Flashcards</h1>
          <span className="text-xs text-text-muted font-mono">({filteredCards.length} cards)</span>
        </div>

        {/* Search & Deck Filter */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input !min-h-[38px] text-xs w-64"
          />

          <select
            value={selectedDeckFilter}
            onChange={(e) => setSelectedDeckFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="input !min-h-[38px] text-xs w-48"
          >
            <option value="all">All Decks ({cards.length})</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards List Table */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2.5 scrollbar-thin">
        {filteredCards.length === 0 ? (
          <div className="card text-center py-12 text-text-muted text-sm">
            No cards found matching your query.
          </div>
        ) : (
          filteredCards.map((c) => {
            const isDueNow = c.dueDate <= Date.now();
            return (
              <div
                key={c.id}
                className="card !p-3.5 flex items-center justify-between gap-4 hover:border-accent/40 transition-colors"
              >
                {/* Content preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-light text-accent">
                      {deckMap.get(c.deckId) || 'Unknown Deck'}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isDueNow ? 'bg-danger/15 text-danger font-semibold' : 'bg-surface-light text-text-muted'
                      }`}
                    >
                      {formatDueDate(c.dueDate)}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      Interval: {c.interval}d | Ease: {c.ease.toFixed(2)} | Reps: {c.repetitions}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-text truncate mb-0.5">
                    <span className="text-text-muted font-normal text-xs mr-1">Q:</span>
                    {c.front}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    <span className="text-text-muted/60 mr-1">A:</span>
                    {c.back}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => c.id && onEdit(c.id)}
                    className="btn-secondary !min-h-[34px] !px-3 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCard(c.id)}
                    className="btn-ghost !min-h-[34px] !px-2.5 text-xs text-text-muted hover:text-danger"
                    title="Delete card"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
