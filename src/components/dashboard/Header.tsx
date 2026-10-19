import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../db';
import { useLiveQuery } from '../../hooks/useLiveQuery';

interface HeaderProps {
  onNavigateRevise: () => void;
}

export default function Header({ onNavigateRevise }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setTime(new Date()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const dueCards = useLiveQuery(
    () => db.cards.where('dueDate').belowOrEqual(Date.now()).count(),
    [],
    0
  );

  const formatDate = useCallback((d: Date) => {
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatTime = useCallback((d: Date) => {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }, []);

  return (
    <header className="h-14 px-5 flex items-center justify-between border-b border-border shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-text">{formatDate(time)}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-mono text-text-muted tabular-nums">
          {formatTime(time)}
        </span>
        {dueCards > 0 && (
          <button
            onClick={onNavigateRevise}
            className="btn-primary text-sm !min-h-[36px] !py-1.5 !px-4 animate-pulse"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {dueCards} card{dueCards !== 1 ? 's' : ''} due
          </button>
        )}
      </div>
    </header>
  );
}
