import { useState, useEffect, useCallback } from 'react';
import { db, type PomodoroSettings } from '../../db';
import { useLiveQuery } from '../../hooks/useLiveQuery';

type Phase = 'focus' | 'shortBreak' | 'longBreak';

const PHASE_LABELS: Record<Phase, string> = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

const PHASE_COLORS: Record<Phase, string> = {
  focus: 'text-accent',
  shortBreak: 'text-success',
  longBreak: 'text-warning',
};

export default function PomodoroCard() {
  const settings = useLiveQuery(
    () => db.pomodoroSettings.toCollection().first(),
    [],
    null as PomodoroSettings | null
  );

  const [phase, setPhase] = useState<Phase>('focus');
  const [session, setSession] = useState(1);
  const [running, setRunning] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(25 * 60); // seconds
  const [editing, setEditing] = useState(false);

  const focusMin = settings?.focusMinutes ?? 25;
  const shortBreakMin = settings?.shortBreakMinutes ?? 5;
  const longBreakMin = settings?.longBreakMinutes ?? 15;
  const maxSessions = settings?.sessionsBeforeLong ?? 4;

  // Generate a beep sound using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 660;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      // Play a second beep
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 880;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.8);
        } catch { /* ignore */ }
      }, 300);
    } catch { /* Web Audio not available */ }
  }, []);

  const getPhaseMinutes = useCallback(
    (p: Phase) => {
      switch (p) {
        case 'focus': return focusMin;
        case 'shortBreak': return shortBreakMin;
        case 'longBreak': return longBreakMin;
      }
    },
    [focusMin, shortBreakMin, longBreakMin]
  );

  // Timer tick: compute remaining from endTime for accuracy
  useEffect(() => {
    if (!running || !endTime) return;
    const tick = () => {
      const diff = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        setRunning(false);
        setEndTime(null);
        playBeep();
        // Auto-advance to next phase
        if (phase === 'focus') {
          if (session >= maxSessions) {
            setPhase('longBreak');
            setRemaining(longBreakMin * 60);
          } else {
            setPhase('shortBreak');
            setRemaining(shortBreakMin * 60);
          }
        } else {
          if (phase === 'longBreak') {
            setSession(1);
          } else {
            setSession((s) => s + 1);
          }
          setPhase('focus');
          setRemaining(focusMin * 60);
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, endTime, phase, session, maxSessions, focusMin, shortBreakMin, longBreakMin, playBeep]);

  // Reset remaining when settings change and timer is not running
  useEffect(() => {
    if (!running) {
      setRemaining(getPhaseMinutes(phase) * 60);
    }
  }, [settings, phase, running, getPhaseMinutes]);

  const handleStart = () => {
    setEndTime(Date.now() + remaining * 1000);
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
    setEndTime(null);
  };

  const handleReset = () => {
    setRunning(false);
    setEndTime(null);
    setRemaining(getPhaseMinutes(phase) * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - remaining / (getPhaseMinutes(phase) * 60);

  return (
    <div className="card flex flex-col items-center justify-center gap-3 relative overflow-hidden">
      {/* Settings button */}
      <button
        onClick={() => setEditing(!editing)}
        className="absolute top-3 right-3 p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
        title="Settings"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {editing ? (
        <PomodoroSettings settings={settings ?? null} onClose={() => setEditing(false)} />
      ) : (
        <>
          {/* Phase label */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold uppercase tracking-wider ${PHASE_COLORS[phase]}`}>
              {PHASE_LABELS[phase]}
            </span>
            <span className="text-xs text-text-muted">
              Session {session} of {maxSessions}
            </span>
          </div>

          {/* Timer display with ring */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#2A2A38" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={phase === 'focus' ? '#7557ED' : phase === 'shortBreak' ? '#4ADE80' : '#FBBF24'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress)}`}
                className="transition-all duration-300"
              />
            </svg>
            <span className="text-4xl font-bold tabular-nums text-text">
              {formatTime(remaining)}
            </span>
          </div>

          {/* Controls with generous touch-friendly spacing */}
          <div className="flex items-center gap-4 mt-2">
            {!running ? (
              <button onClick={handleStart} className="btn-primary !px-7 !py-2.5 shadow-lg shadow-accent/20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start
              </button>
            ) : (
              <button onClick={handlePause} className="btn-secondary !px-7 !py-2.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-xl bg-surface-light hover:bg-border text-text-muted hover:text-text flex items-center justify-center transition-all active:scale-95"
              title="Reset Timer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PomodoroSettings({
  settings,
  onClose,
}: {
  settings: PomodoroSettings | null;
  onClose: () => void;
}) {
  const [focus, setFocus] = useState(settings?.focusMinutes ?? 25);
  const [shortBreak, setShortBreak] = useState(settings?.shortBreakMinutes ?? 5);
  const [longBreak, setLongBreak] = useState(settings?.longBreakMinutes ?? 15);
  const [sessions, setSessions] = useState(settings?.sessionsBeforeLong ?? 4);

  const handleSave = async () => {
    const id = settings?.id;
    if (id) {
      await db.pomodoroSettings.update(id, {
        focusMinutes: focus,
        shortBreakMinutes: shortBreak,
        longBreakMinutes: longBreak,
        sessionsBeforeLong: sessions,
      });
    }
    onClose();
  };

  return (
    <div className="w-full space-y-3 p-2">
      <h3 className="text-sm font-semibold text-text">Timer Settings</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-text-muted">Focus (min)</span>
          <input type="number" className="input !text-sm" value={focus} min={1} max={120}
            onChange={(e) => setFocus(Number(e.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-text-muted">Short Break</span>
          <input type="number" className="input !text-sm" value={shortBreak} min={1} max={60}
            onChange={(e) => setShortBreak(Number(e.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-text-muted">Long Break</span>
          <input type="number" className="input !text-sm" value={longBreak} min={1} max={60}
            onChange={(e) => setLongBreak(Number(e.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-text-muted">Sessions</span>
          <input type="number" className="input !text-sm" value={sessions} min={1} max={10}
            onChange={(e) => setSessions(Number(e.target.value))} />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="btn-primary text-sm flex-1 !min-h-[40px]">Save</button>
        <button onClick={onClose} className="btn-ghost text-sm !min-h-[40px]">Cancel</button>
      </div>
    </div>
  );
}
