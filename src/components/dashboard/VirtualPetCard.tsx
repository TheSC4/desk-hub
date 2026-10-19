import { useState, useEffect } from 'react';
import { db, type PetState } from '../../db';
import { useLiveQuery } from '../../hooks/useLiveQuery';

// Pet visual avatars and character presets
const PET_TYPES: { id: PetState['type']; label: string; avatar: string; description: string }[] = [
  { id: 'owl', label: 'Athena', avatar: '🦉', description: 'Wise Gate Owl - gains bonus XP during late night study' },
  { id: 'cat', label: 'Mochi', avatar: '🐱', description: 'Curious Cat - loves pomodoro streaks and focus sessions' },
  { id: 'dragon', label: 'Ignis', avatar: '🐲', description: 'Exam Dragon - breathes fire as you master difficult topics' },
  { id: 'robot', label: 'Byte', avatar: '🤖', description: 'Algo Bot - computes optimal revision paths and logic checks' },
];

const DIALOGUES = [
  "Time to solve some OS scheduling problems! Let's go!",
  "Great focus! Every flashcard brings us closer to AIR < 100!",
  "Remember: P = NP? Still unproven, but we can prove your dedication!",
  "Did you know? Dijkstra's algorithm uses a greedy approach!",
  "Keep going! Your daily streak is looking awesome!",
  "Hydrate and sit straight! Good posture = sharp memory.",
  "Let's conquer Engineering Math today!",
];

export default function VirtualPetCard() {
  const pet = useLiveQuery(
    () => db.pet.toCollection().first(),
    [],
    null as PetState | null
  );

  const [dialogue, setDialogue] = useState<string>("Ready to study! Let's conquer GATE CSE today!");
  const [animating, setAnimating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const currentType = PET_TYPES.find((p) => p.id === pet?.type) || PET_TYPES[0];

  // Random speech bubble changes every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const randomText = DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)];
      setDialogue(randomText);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const triggerAnimation = (message: string) => {
    setDialogue(message);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 900);
  };

  // Feed pet (gives energy + small XP)
  const handleFeed = async () => {
    if (!pet || !pet.id) return;
    const newEnergy = Math.min(100, pet.energy + 15);
    const newXp = pet.xp + 10;
    const nextLevel = newXp >= pet.level * 100 ? pet.level + 1 : pet.level;

    await db.pet.update(pet.id, {
      energy: newEnergy,
      xp: newXp,
      level: nextLevel,
      lastInteracted: Date.now(),
    });

    triggerAnimation(
      nextLevel > pet.level
        ? `🎉 Level Up! ${pet.name} reached Level ${nextLevel}!`
        : `Yum! ☕ Brain food replenished! Energy is now ${newEnergy}%!`
    );
  };

  // Pet / Play (boosts happiness)
  const handlePet = async () => {
    if (!pet || !pet.id) return;
    const newHappy = Math.min(100, pet.happiness + 15);
    const newXp = pet.xp + 5;
    const nextLevel = newXp >= pet.level * 100 ? pet.level + 1 : pet.level;

    await db.pet.update(pet.id, {
      happiness: newHappy,
      xp: newXp,
      level: nextLevel,
      lastInteracted: Date.now(),
    });

    triggerAnimation(
      nextLevel > pet.level
        ? `🎉 Level Up! ${pet.name} reached Level ${nextLevel}!`
        : `*Purrs* ✨ Happiness +15%! Studying together is fun!`
    );
  };

  // Study boost (exchange energy for XP)
  const handleStudyBoost = async () => {
    if (!pet || !pet.id) return;
    if (pet.energy < 20) {
      triggerAnimation("Too tired! Feed me coffee ☕ before studying more!");
      return;
    }

    const newEnergy = Math.max(0, pet.energy - 20);
    const newXp = pet.xp + 35;
    const nextLevel = newXp >= pet.level * 100 ? pet.level + 1 : pet.level;

    await db.pet.update(pet.id, {
      energy: newEnergy,
      xp: newXp,
      level: nextLevel,
      totalStudyMinutes: pet.totalStudyMinutes + 25,
      lastInteracted: Date.now(),
    });

    triggerAnimation(
      nextLevel > pet.level
        ? `🌟 Incredible! Level ${nextLevel}! +35 Focus XP earned!`
        : `⚡ 25 min Study session logged! +35 XP! Knowledge leveled up!`
    );
  };

  const handleChangePetType = async (type: PetState['type']) => {
    if (!pet || !pet.id) return;
    await db.pet.update(pet.id, { type });
    setShowPicker(false);
  };

  const handleSaveName = async () => {
    if (!pet || !pet.id || !nameInput.trim()) return;
    await db.pet.update(pet.id, { name: nameInput.trim() });
    setIsEditingName(false);
  };

  const xpNeeded = (pet?.level ?? 1) * 100;
  const xpPercent = Math.min(100, Math.round(((pet?.xp ?? 0) % 100) / (xpNeeded / (pet?.level ?? 1))));

  return (
    <div className="card flex flex-col justify-between h-full p-4 relative overflow-hidden">
      {/* Top Header: Pet Identity & Level */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="input !py-0.5 !px-2 !min-h-[28px] text-xs max-w-[120px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <button onClick={handleSaveName} className="text-xs text-accent font-semibold px-1">
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-text text-sm">{pet?.name ?? 'Desk Buddy'}</h3>
              <button
                onClick={() => {
                  setNameInput(pet?.name ?? '');
                  setIsEditingName(true);
                }}
                className="text-text-muted hover:text-text p-0.5"
                title="Rename pet"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">
            Lv. {pet?.level ?? 1}
          </span>
        </div>

        <button
          onClick={() => setShowPicker(!showPicker)}
          className="btn-ghost !min-h-[28px] !px-2 text-[11px] text-text-muted hover:text-text gap-1"
          title="Switch pet companion"
        >
          <span>Change Pet</span>
          <span className="text-xs">{currentType.avatar}</span>
        </button>
      </div>

      {/* Pet Switcher Modal Dropdown */}
      {showPicker && (
        <div className="absolute inset-x-4 top-12 z-20 card !p-3 border-accent/40 bg-surface/95 backdrop-blur-md shadow-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text">Choose Your Study Companion:</span>
            <button onClick={() => setShowPicker(false)} className="text-xs text-text-muted hover:text-text">
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PET_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleChangePetType(t.id)}
                className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  pet?.type === t.id
                    ? 'bg-accent/20 border-accent text-accent-light'
                    : 'bg-surface-light border-border hover:border-accent/40 text-text'
                }`}
              >
                <span className="text-2xl">{t.avatar}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">{t.label}</p>
                  <p className="text-[10px] text-text-muted truncate">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Center Avatar & Speech Bubble Area */}
      <div className="flex items-center gap-4 my-2 px-1">
        {/* Animated Avatar */}
        <div
          onClick={handlePet}
          className={`w-20 h-20 rounded-2xl bg-surface-light/80 border border-border/80 flex items-center justify-center text-5xl cursor-pointer select-none transition-transform active:scale-90 relative shrink-0 ${
            animating ? 'animate-bounce' : 'hover:scale-105'
          }`}
          title="Click to pet me!"
        >
          <span>{currentType.avatar}</span>
          <span className="absolute -bottom-1 -right-1 text-xs">✨</span>
        </div>

        {/* Speech Bubble */}
        <div className="flex-1 min-w-0 relative bg-surface-light/60 p-3 rounded-2xl border border-border/60">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-surface-light" />
          <p className="text-xs text-text font-medium leading-relaxed italic">
            "{dialogue}"
          </p>
          <span className="text-[10px] text-text-muted block mt-1">
            Tap avatar to pet • Feed coffee for energy!
          </span>
        </div>
      </div>

      {/* Stats Gauges Strip: Energy, Happiness, Level XP */}
      <div className="space-y-1.5 my-1">
        {/* Energy bar */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted flex items-center gap-1">
            <span>⚡ Energy</span>
          </span>
          <span className="font-mono text-text">{pet?.energy ?? 100}%</span>
        </div>
        <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-warning h-full rounded-full transition-all duration-300"
            style={{ width: `${pet?.energy ?? 100}%` }}
          />
        </div>

        {/* Happiness bar */}
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="text-text-muted flex items-center gap-1">
            <span>💖 Mood</span>
          </span>
          <span className="font-mono text-text">{pet?.happiness ?? 100}%</span>
        </div>
        <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#EC4899] h-full rounded-full transition-all duration-300"
            style={{ width: `${pet?.happiness ?? 100}%` }}
          />
        </div>

        {/* XP / Next Level */}
        <div className="flex items-center justify-between text-[10px] pt-0.5 text-text-muted">
          <span>Level Progress</span>
          <span className="font-mono">{xpPercent}%</span>
        </div>
        <div className="w-full bg-surface-light h-1 rounded-full overflow-hidden">
          <div
            className="bg-accent h-full rounded-full transition-all duration-300"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive Action Buttons with generous spacing */}
      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-border/50 shrink-0">
        <button
          onClick={handleFeed}
          className="btn-secondary !min-h-[40px] !px-2 text-xs font-semibold gap-1.5"
          title="Feed coffee to restore energy"
        >
          <span>☕</span>
          <span>Feed</span>
        </button>

        <button
          onClick={handlePet}
          className="btn-secondary !min-h-[40px] !px-2 text-xs font-semibold gap-1.5"
          title="Pet to boost mood"
        >
          <span>💖</span>
          <span>Pet</span>
        </button>

        <button
          onClick={handleStudyBoost}
          className="btn-primary !min-h-[40px] !px-2 text-xs font-semibold gap-1.5"
          title="Log 25m study sprint to earn XP"
        >
          <span>📖</span>
          <span>Study +XP</span>
        </button>
      </div>
    </div>
  );
}
