import { useState, useRef } from 'react';
import { db, type Card } from '../../db';

interface SettingsModalProps {
  onClose: () => void;
}

// Convert Blob to base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert base64 string back to Blob
const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return await res.blob();
};

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export entire DB to JSON
  const handleExport = async () => {
    try {
      setBusy(true);
      setStatus('Exporting data...');

      const decks = await db.decks.toArray();
      const rawCards = await db.cards.toArray();
      const reviewLogs = await db.reviewLogs.toArray();
      const subjects = await db.subjects.toArray();
      const topics = await db.topics.toArray();
      const dailyTargets = await db.dailyTargets.toArray();
      const pomodoroSettings = await db.pomodoroSettings.toArray();

      // Convert card image Blobs to Base64
      const cards = await Promise.all(
        rawCards.map(async (c) => ({
          ...c,
          frontImage: c.frontImage ? await blobToBase64(c.frontImage) : undefined,
          backImage: c.backImage ? await blobToBase64(c.backImage) : undefined,
        }))
      );

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        decks,
        cards,
        reviewLogs,
        subjects,
        topics,
        dailyTargets,
        pomodoroSettings,
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `desk-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus('Export complete! File downloaded.');
    } catch (err) {
      console.error(err);
      setStatus('Export failed. Check console for details.');
    } finally {
      setBusy(false);
    }
  };

  // Import DB from JSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBusy(true);
      setStatus('Reading file...');

      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.decks || !data.cards) {
        throw new Error('Invalid backup file format');
      }

      setStatus('Restoring database tables...');

      await db.transaction(
        'rw',
        [db.decks, db.cards, db.reviewLogs, db.subjects, db.topics, db.dailyTargets, db.pomodoroSettings],
        async () => {
          // Clear current tables
          await Promise.all([
            db.decks.clear(),
            db.cards.clear(),
            db.reviewLogs.clear(),
            db.subjects.clear(),
            db.topics.clear(),
            db.dailyTargets.clear(),
            db.pomodoroSettings.clear(),
          ]);

          // Re-insert decks
          if (data.decks?.length) await db.decks.bulkAdd(data.decks);

          // Re-insert cards with restored Blobs
          if (data.cards?.length) {
            const restoredCards = await Promise.all(
              data.cards.map(async (c: any) => ({
                ...c,
                frontImage: c.frontImage ? await base64ToBlob(c.frontImage) : undefined,
                backImage: c.backImage ? await base64ToBlob(c.backImage) : undefined,
              }))
            );
            await db.cards.bulkAdd(restoredCards);
          }

          if (data.reviewLogs?.length) await db.reviewLogs.bulkAdd(data.reviewLogs);
          if (data.subjects?.length) await db.subjects.bulkAdd(data.subjects);
          if (data.topics?.length) await db.topics.bulkAdd(data.topics);
          if (data.dailyTargets?.length) await db.dailyTargets.bulkAdd(data.dailyTargets);
          if (data.pomodoroSettings?.length) await db.pomodoroSettings.bulkAdd(data.pomodoroSettings);
        }
      );

      setStatus('Data restored successfully! Refreshing view...');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatus(`Import error: ${err.message || 'Corrupted file'}`);
    } finally {
      setBusy(false);
    }
  };

  // Seed sample starter flashcards for GATE CSE
  const handleSeedSampleCards = async () => {
    try {
      setBusy(true);
      setStatus('Adding sample GATE CSE flashcards...');

      let deck = await db.decks.where('name').equals('GATE CSE Core').first();
      let deckId: number;
      if (!deck) {
        deckId = (await db.decks.add({ name: 'GATE CSE Core', createdAt: Date.now() })) as number;
      } else {
        deckId = deck.id!;
      }

      const sampleCards: Omit<Card, 'id'>[] = [
        {
          deckId,
          front: 'What is the time complexity of building a heap with $n$ elements using Floyd’s build-heap algorithm?',
          back: '$\\mathcal{O}(n)$, not $\\mathcal{O}(n \\log n)$, because the sum of heights across all internal nodes converges linearly.',
          ease: 2.5,
          interval: 0,
          repetitions: 0,
          dueDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          deckId,
          front: 'What are the 4 necessary conditions for a Deadlock in Operating Systems?',
          back: '1. **Mutual Exclusion**\n2. **Hold and Wait**\n3. **No Preemption**\n4. **Circular Wait**',
          ease: 2.5,
          interval: 0,
          repetitions: 0,
          dueDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          deckId,
          front: 'In relational databases, what distinguishes 3NF from BCNF?',
          back: 'In BCNF, for every functional dependency $X \\to Y$, $X$ must be a superkey.\n\nIn 3NF, $Y$ can also be a prime attribute (part of any candidate key), allowing some transitive dependencies that BCNF prohibits.',
          ease: 2.5,
          interval: 0,
          repetitions: 0,
          dueDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          deckId,
          front: 'Is the Halting Problem decidable or undecidable?',
          back: 'The Halting Problem is **undecidable** (proven via Turing reduction and diagonalization). It is recursively enumerable (Turing-recognizable) but not recursive.',
          ease: 2.5,
          interval: 0,
          repetitions: 0,
          dueDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await db.cards.bulkAdd(sampleCards as Card[]);
      setStatus('4 sample flashcards added to "GATE CSE Core" deck!');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-base font-semibold text-text">Data Management & Backup</h2>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text rounded-lg">
            ✕
          </button>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          All Desk Hub data is stored entirely in your tablet's local IndexedDB. You can export your full progress (including flashcard images) or restore from an earlier backup at any time.
        </p>

        {status && (
          <div className="p-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-medium">
            {status}
          </div>
        )}

        <div className="space-y-2.5">
          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={busy}
            className="btn-secondary w-full justify-start text-xs font-semibold gap-2.5 !min-h-[44px]"
          >
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Backup (JSON with Base64 Images)
          </button>

          {/* Import file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="btn-secondary w-full justify-start text-xs font-semibold gap-2.5 !min-h-[44px]"
          >
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Restore Backup from JSON
          </button>

          {/* Seed Sample Cards */}
          <button
            onClick={handleSeedSampleCards}
            disabled={busy}
            className="btn-ghost w-full justify-start text-xs font-semibold gap-2.5 !min-h-[44px] text-accent"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Load Sample GATE CSE Flashcards
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button onClick={onClose} className="btn-primary text-xs !min-h-[38px] !px-5">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
