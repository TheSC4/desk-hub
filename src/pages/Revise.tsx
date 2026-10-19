import { useState } from 'react';
import DeckList from '../components/revise/DeckList';
import ReviewMode from '../components/revise/ReviewMode';
import CardBrowser from '../components/revise/CardBrowser';
import CardEditor from '../components/revise/CardEditor';
import SettingsModal from '../components/revise/SettingsModal';

export type ReviseView = 'home' | 'review' | 'browse' | 'add' | 'edit';

export interface ReviewSession {
  deckId?: number; // undefined = all decks
}

export default function Revise() {
  const [view, setView] = useState<ReviseView>('home');
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [editingCardId, setEditingCardId] = useState<number | undefined>();
  const [targetDeckId, setTargetDeckId] = useState<number | undefined>();
  const [showSettings, setShowSettings] = useState(false);

  const startReview = (deckId?: number) => {
    setReviewSession({ deckId });
    setView('review');
  };

  const exitReview = () => {
    setReviewSession(null);
    setView('home');
  };

  const openEditor = (cardId?: number, deckId?: number) => {
    setEditingCardId(cardId);
    setTargetDeckId(deckId);
    setView(cardId ? 'edit' : 'add');
  };

  return (
    <div className="h-full overflow-hidden relative">
      {view === 'home' && (
        <DeckList
          onStartReview={startReview}
          onBrowse={() => setView('browse')}
          onAddCard={(deckId) => openEditor(undefined, deckId)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      {view === 'review' && reviewSession && (
        <ReviewMode session={reviewSession} onExit={exitReview} />
      )}
      {view === 'browse' && (
        <CardBrowser
          onBack={() => setView('home')}
          onEdit={(id) => openEditor(id)}
        />
      )}
      {(view === 'add' || view === 'edit') && (
        <CardEditor
          cardId={editingCardId}
          initialDeckId={targetDeckId}
          onBack={() => setView('home')}
          onSaved={() => setView('home')}
        />
      )}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
