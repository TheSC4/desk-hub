import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { db, type Card } from '../../db';
import { scheduleCard, getNextIntervalText, type Rating } from '../../lib/scheduler';
import type { ReviewSession } from '../../pages/Revise';

interface ReviewModeProps {
  session: ReviewSession;
  onExit: () => void;
}

export default function ReviewMode({ session, onExit }: ReviewModeProps) {
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  // Load cards due for review
  useEffect(() => {
    const loadDueCards = async () => {
      setLoading(true);
      const now = Date.now();
      let dueCards: Card[];

      if (session.deckId !== undefined) {
        dueCards = await db.cards
          .where('deckId')
          .equals(session.deckId)
          .filter((c) => c.dueDate <= now)
          .toArray();
      } else {
        dueCards = await db.cards
          .where('dueDate')
          .belowOrEqual(now)
          .toArray();
      }

      // Shuffle cards for varied review session
      const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      setLoading(false);
    };

    loadDueCards();
  }, [session.deckId]);

  const currentCard = queue[currentIndex];
  const totalCards = queue.length + completedCount;

  // Blob URLs for card images
  const frontImageUrl = useMemo(() => {
    if (!currentCard?.frontImage) return null;
    return URL.createObjectURL(currentCard.frontImage);
  }, [currentCard?.frontImage]);

  const backImageUrl = useMemo(() => {
    if (!currentCard?.backImage) return null;
    return URL.createObjectURL(currentCard.backImage);
  }, [currentCard?.backImage]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (frontImageUrl) URL.revokeObjectURL(frontImageUrl);
      if (backImageUrl) URL.revokeObjectURL(backImageUrl);
    };
  }, [frontImageUrl, backImageUrl]);

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!currentCard || !currentCard.id) return;

      const now = Date.now();
      const nextSchedule = scheduleCard(
        {
          ease: currentCard.ease,
          interval: currentCard.interval,
          repetitions: currentCard.repetitions,
          dueDate: currentCard.dueDate,
        },
        rating,
        now
      );

      // Save card schedule updates to Dexie
      await db.cards.update(currentCard.id, {
        ...nextSchedule,
        updatedAt: now,
      });

      // Record review log
      await db.reviewLogs.add({
        cardId: currentCard.id,
        rating,
        ease: nextSchedule.ease,
        interval: nextSchedule.interval,
        reviewedAt: now,
      });

      // If rated 'Again', re-insert into current review session queue
      if (rating === 1) {
        setQueue((prev) => {
          const updated = [...prev];
          // Push to the end of the session queue so user sees it again
          const repeated = { ...currentCard, ...nextSchedule };
          return [...updated.slice(0, currentIndex), ...updated.slice(currentIndex + 1), repeated];
        });
        setIsFlipped(false);
      } else {
        setCompletedCount((c) => c + 1);
        if (currentIndex < queue.length - 1) {
          setCurrentIndex((idx) => idx + 1);
          setIsFlipped(false);
        } else {
          // Finished all
          setQueue([]);
        }
      }
    },
    [currentCard, currentIndex, queue.length]
  );

  // Keyboard navigation: Space = flip, 1-4 = rating, Esc = exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleRate, onExit]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Session Completed screen
  if (!currentCard || queue.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center text-3xl mb-4 text-success">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Review Session Complete!</h2>
        <p className="text-text-muted text-sm max-w-sm mb-6">
          You completed {completedCount} flashcard reviews. Great work keeping your knowledge active!
        </p>
        <button onClick={onExit} className="btn-primary !min-h-[48px] !px-8 text-sm font-semibold">
          Back to Decks
        </button>
      </div>
    );
  }

  const remainingCards = queue.length - currentIndex;
  const progressPercent = totalCards > 0 ? Math.round((completedCount / totalCards) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-bg overflow-hidden select-none">
      {/* Top bar: progress and exit */}
      <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="w-full bg-surface-light h-2 rounded-full overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-text-muted shrink-0 tabular-nums">
            {remainingCards} left
          </span>
        </div>

        <button
          onClick={onExit}
          className="btn-ghost !min-h-[36px] !px-3 text-xs gap-1.5"
          title="Exit review (Esc)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit
        </button>
      </div>

      {/* Main Flashcard Card area */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-hidden">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full max-w-3xl h-[420px] card flex flex-col cursor-pointer transition-all duration-300 relative border-2 ${
            isFlipped ? 'border-accent/60 shadow-lg shadow-accent/5' : 'border-border hover:border-accent/30'
          }`}
        >
          {/* Card Label Tag */}
          <div className="absolute top-4 left-5 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-light text-text-muted">
              {isFlipped ? 'Answer' : 'Question'}
            </span>
            <span className="text-[11px] text-text-muted/60">
              (Tap card or press Space to {isFlipped ? 'hide' : 'flip'})
            </span>
          </div>

          {/* Front content */}
          <div className={`flex-1 p-8 pt-12 overflow-y-auto scrollbar-thin ${isFlipped ? 'border-b border-border/60' : ''}`}>
            <div className="prose prose-invert max-w-none text-text text-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {currentCard.front}
              </ReactMarkdown>
            </div>
            {frontImageUrl && (
              <div className="mt-4 max-h-48 rounded-lg overflow-hidden border border-border">
                <img src={frontImageUrl} alt="Front attachment" className="max-h-48 object-contain mx-auto" />
              </div>
            )}
          </div>

          {/* Back content (revealed when flipped) */}
          {isFlipped && (
            <div className="flex-1 p-8 overflow-y-auto scrollbar-thin bg-surface-light/30">
              <div className="prose prose-invert max-w-none text-text text-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {currentCard.back}
                </ReactMarkdown>
              </div>
              {backImageUrl && (
                <div className="mt-4 max-h-48 rounded-lg overflow-hidden border border-border">
                  <img src={backImageUrl} alt="Back attachment" className="max-h-48 object-contain mx-auto" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="h-24 px-6 border-t border-border flex items-center justify-center shrink-0 bg-surface/50">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="btn-primary !min-h-[50px] !px-12 text-sm font-semibold tracking-wide"
          >
            Show Answer (Space)
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
            {/* Again (1) */}
            <button
              onClick={() => handleRate(1)}
              className="btn flex flex-col items-center justify-center !min-h-[52px] bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 rounded-xl"
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>Again</span>
                <span className="text-[10px] opacity-70">(1)</span>
              </div>
              <span className="text-xs font-mono font-medium opacity-85">
                {getNextIntervalText(currentCard, 1)}
              </span>
            </button>

            {/* Hard (2) */}
            <button
              onClick={() => handleRate(2)}
              className="btn flex flex-col items-center justify-center !min-h-[52px] bg-warning/15 hover:bg-warning/25 text-warning border border-warning/30 rounded-xl"
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>Hard</span>
                <span className="text-[10px] opacity-70">(2)</span>
              </div>
              <span className="text-xs font-mono font-medium opacity-85">
                {getNextIntervalText(currentCard, 2)}
              </span>
            </button>

            {/* Good (3) */}
            <button
              onClick={() => handleRate(3)}
              className="btn flex flex-col items-center justify-center !min-h-[52px] bg-success/15 hover:bg-success/25 text-success border border-success/30 rounded-xl"
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>Good</span>
                <span className="text-[10px] opacity-70">(3)</span>
              </div>
              <span className="text-xs font-mono font-medium opacity-85">
                {getNextIntervalText(currentCard, 3)}
              </span>
            </button>

            {/* Easy (4) */}
            <button
              onClick={() => handleRate(4)}
              className="btn flex flex-col items-center justify-center !min-h-[52px] bg-accent/20 hover:bg-accent/30 text-accent-light border border-accent/40 rounded-xl"
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>Easy</span>
                <span className="text-[10px] opacity-70">(4)</span>
              </div>
              <span className="text-xs font-mono font-medium opacity-85">
                {getNextIntervalText(currentCard, 4)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
