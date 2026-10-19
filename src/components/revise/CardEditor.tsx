import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { db, type Deck } from '../../db';
import { createInitialSchedule } from '../../lib/scheduler';
import { useLiveQuery } from '../../hooks/useLiveQuery';

interface CardEditorProps {
  cardId?: number;
  initialDeckId?: number;
  onBack: () => void;
  onSaved: () => void;
}

export default function CardEditor({
  cardId,
  initialDeckId,
  onBack,
  onSaved,
}: CardEditorProps) {
  const decks = useLiveQuery(() => db.decks.toArray(), [], [] as Deck[]);

  const [deckId, setDeckId] = useState<number | ''>(initialDeckId ?? '');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [frontImageBlob, setFrontImageBlob] = useState<Blob | null>(null);
  const [backImageBlob, setBackImageBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);

  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);

  // Set default deck if available
  useEffect(() => {
    if (decks.length > 0 && deckId === '') {
      setDeckId(initialDeckId ?? decks[0].id ?? '');
    }
  }, [decks, deckId, initialDeckId]);

  // Load existing card if editing
  useEffect(() => {
    if (!cardId) return;
    const load = async () => {
      const card = await db.cards.get(cardId);
      if (card) {
        setFront(card.front);
        setBack(card.back);
        setDeckId(card.deckId);
        setFrontImageBlob(card.frontImage ?? null);
        setBackImageBlob(card.backImage ?? null);
      }
    };
    load();
  }, [cardId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'front') {
      setFrontImageBlob(file);
    } else {
      setBackImageBlob(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || deckId === '') return;

    setIsSaving(true);
    const now = Date.now();

    try {
      if (cardId) {
        // Edit existing
        await db.cards.update(cardId, {
          deckId: Number(deckId),
          front: front.trim(),
          back: back.trim(),
          frontImage: frontImageBlob ?? undefined,
          backImage: backImageBlob ?? undefined,
          updatedAt: now,
        });
      } else {
        // Create new
        const initialSchedule = createInitialSchedule();
        await db.cards.add({
          deckId: Number(deckId),
          front: front.trim(),
          back: back.trim(),
          frontImage: frontImageBlob ?? undefined,
          backImage: backImageBlob ?? undefined,
          ease: initialSchedule.ease,
          interval: initialSchedule.interval,
          repetitions: initialSchedule.repetitions,
          dueDate: initialSchedule.dueDate,
          createdAt: now,
          updatedAt: now,
        });
      }
      onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!cardId) return;
    if (!confirm('Are you sure you want to delete this card?')) return;
    await db.cards.delete(cardId);
    onBack();
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn-ghost !min-h-[38px] !px-2.5 text-xs text-text-muted hover:text-text"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-text">
            {cardId ? 'Edit Flashcard' : 'Create Flashcard'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit / Preview toggle */}
          <div className="flex items-center p-1 bg-surface-light rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'edit' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'preview' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              Preview
            </button>
          </div>

          {cardId && (
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger !min-h-[38px] !px-3 text-xs"
            >
              Delete
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!front.trim() || !back.trim() || deckId === '' || isSaving}
            className="btn-primary !min-h-[38px] !px-5 text-xs font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Card'}
          </button>
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4 scrollbar-thin">
        {/* Deck selection */}
        <div className="card !p-4 flex items-center gap-4">
          <label className="text-sm font-semibold text-text shrink-0">Select Deck:</label>
          <select
            value={deckId}
            onChange={(e) => setDeckId(Number(e.target.value))}
            className="input !min-h-[38px] text-xs flex-1 max-w-sm"
          >
            {decks.length === 0 ? (
              <option value="">No decks available - please create one</option>
            ) : (
              decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))
            )}
          </select>
        </div>

        {activeTab === 'edit' ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Front Side */}
            <div className="card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text">Front (Question / Prompt)</span>
                <span className="text-[11px] text-text-muted">Markdown supported</span>
              </div>
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="e.g. What is the time complexity of Dijkstra's algorithm with a min-heap?"
                rows={6}
                className="input !p-3 font-mono text-xs w-full resize-none leading-relaxed"
              />

              {/* Front Image Attachment */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <input
                  type="file"
                  ref={frontFileRef}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'front')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => frontFileRef.current?.click()}
                  className="btn-secondary !min-h-[34px] !px-3 text-xs gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {frontImageBlob ? 'Change Front Image' : 'Attach Front Image'}
                </button>

                {frontImageBlob && (
                  <button
                    type="button"
                    onClick={() => setFrontImageBlob(null)}
                    className="text-xs text-danger hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              {frontImageBlob && (
                <div className="mt-1 p-2 rounded-lg bg-surface-light border border-border">
                  <p className="text-[11px] text-text-muted mb-1 font-mono">Attachment ready ({Math.round(frontImageBlob.size / 1024)} KB)</p>
                </div>
              )}
            </div>

            {/* Back Side */}
            <div className="card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text">Back (Answer / Explanation)</span>
                <span className="text-[11px] text-text-muted">Markdown & code blocks</span>
              </div>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="e.g. O((V + E) log V) using an adjacency list and binary min-heap."
                rows={6}
                className="input !p-3 font-mono text-xs w-full resize-none leading-relaxed"
              />

              {/* Back Image Attachment */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <input
                  type="file"
                  ref={backFileRef}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'back')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backFileRef.current?.click()}
                  className="btn-secondary !min-h-[34px] !px-3 text-xs gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {backImageBlob ? 'Change Back Image' : 'Attach Back Image'}
                </button>

                {backImageBlob && (
                  <button
                    type="button"
                    onClick={() => setBackImageBlob(null)}
                    className="text-xs text-danger hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              {backImageBlob && (
                <div className="mt-1 p-2 rounded-lg bg-surface-light border border-border">
                  <p className="text-[11px] text-text-muted mb-1 font-mono">Attachment ready ({Math.round(backImageBlob.size / 1024)} KB)</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Live Markdown Preview */
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <span className="text-xs font-semibold text-text-muted uppercase mb-3 block">Front Preview</span>
              <div className="prose prose-invert max-w-none text-text text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {front || '*No front text entered yet*'}
                </ReactMarkdown>
              </div>
            </div>
            <div className="card">
              <span className="text-xs font-semibold text-text-muted uppercase mb-3 block">Back Preview</span>
              <div className="prose prose-invert max-w-none text-text text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {back || '*No back text entered yet*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
