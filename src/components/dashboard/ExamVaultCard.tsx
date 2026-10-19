import { useState, useEffect, useMemo } from 'react';

// GATE CSE High-Yield Formula Bank & Cheat Sheet
const FORMULA_VAULT = [
  {
    category: 'Algorithms & DS',
    title: "Master Theorem (Divide & Conquer)",
    formula: "T(n) = aT(n/b) + Θ(n^k log^p n)",
    notes: "If log_b(a) > k ⇒ Θ(n^(log_b a)). If log_b(a) = k ⇒ Θ(n^k log^(p+1) n).",
    tag: 'High Yield',
  },
  {
    category: 'Computer Networks',
    title: 'Sliding Window Protocols Efficiency',
    formula: "η = N / (1 + 2a), where a = Tp / Tt",
    notes: "Stop-and-Wait: N = 1. Go-Back-N: Window N. Selective Repeat: Window 2^(m-1).",
    tag: 'Formula',
  },
  {
    category: 'Databases (DBMS)',
    title: 'Conflict Serializability & View Equivalence',
    formula: "Precedence Graph (Wait-for Graph Cycle Check)",
    notes: "A schedule is conflict serializable iff its precedence graph has no directed cycles.",
    tag: 'Core Concept',
  },
  {
    category: 'Operating Systems',
    title: 'Virtual Memory & Effective Access Time',
    formula: "EAT = h × (m + c) + (1 - h) × (2m + c)",
    notes: "h = TLB hit ratio, c = TLB lookup time, m = Main memory access time (single page table).",
    tag: 'Calculation',
  },
  {
    category: 'Theory of Computation',
    title: "Chomsky Hierarchy & Automata",
    formula: "Regular (DFA/NFA) ⊂ CFL (PDA) ⊂ CSL (LBA) ⊂ Recursive ⊂ RE (TM)",
    notes: "Halting & Equivalence of CFGs are Undecidable. Emptiness of CFL is Decidable.",
    tag: 'Hierarchy',
  },
  {
    category: 'Digital Logic',
    title: 'K-Map & Minimization',
    formula: "Minimal SOP = Essential Prime Implicants + Minimal Cover",
    notes: "Gray coding on adjacent cells ensures single-bit Hamming distance.",
    tag: 'Quick Rule',
  },
  {
    category: 'Discrete Mathematics',
    title: 'Graph Theory & Handshaking Lemma',
    formula: "∑ deg(v) = 2|E|",
    notes: "Every undirected graph has an even number of vertices of odd degree.",
    tag: 'Identity',
  },
  {
    category: 'COA',
    title: 'Pipeline Speedup & Efficiency',
    formula: "Speedup S = n × k / (k + n - 1)  [ideal = k]",
    notes: "Under hazards / stalls: CPI_pipelined = 1 + Stall_cycles_per_instruction.",
    tag: 'Formula',
  },
];

export default function ExamVaultCard() {
  const [index, setIndex] = useState(0);
  const [examDate, setExamDate] = useState('2027-02-06'); // First weekend of February (Typical GATE exam)
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [animating, setAnimating] = useState(false);

  const current = FORMULA_VAULT[index];

  // Calculate days & hours countdown
  const timeRemaining = useMemo(() => {
    const target = new Date(examDate).getTime();
    const now = Date.now();
    const diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const weeks = Math.floor(days / 7);

    return { days, hours, weeks };
  }, [examDate]);

  // Subtle auto-rotation of formula every 45s unless interacted with
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setIndex((i) => (i + 1) % FORMULA_VAULT.length);
      setAnimating(false);
    }, 200);
  };

  const handlePrev = () => {
    setAnimating(true);
    setTimeout(() => {
      setIndex((i) => (i - 1 + FORMULA_VAULT.length) % FORMULA_VAULT.length);
      setAnimating(false);
    }, 200);
  };

  return (
    <div className="card flex flex-col justify-between h-full p-4 relative overflow-hidden bg-gradient-to-br from-surface to-surface/90 border border-border">
      {/* Top Banner: GATE Countdown Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <h3 className="font-semibold text-text text-sm tracking-wide">GATE CSE Countdown</h3>
        </div>

        {isEditingDate ? (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="input !py-0.5 !px-2 !min-h-[28px] text-xs text-text"
            />
            <button
              onClick={() => setIsEditingDate(false)}
              className="text-xs text-accent font-semibold px-1"
            >
              Done
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingDate(true)}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to edit exam date"
          >
            <div className="flex items-baseline gap-1 bg-surface-light/80 px-2.5 py-1 rounded-lg border border-border/60">
              <span className="text-base font-bold text-accent tabular-nums">{timeRemaining.days}</span>
              <span className="text-[11px] text-text-muted font-medium">days left</span>
              <span className="text-[10px] text-text-muted/60 ml-1">({timeRemaining.weeks} wks)</span>
            </div>
          </div>
        )}
      </div>

      {/* Center Formula Card with smooth transition */}
      <div
        className={`flex-1 flex flex-col justify-center my-2 p-3.5 rounded-xl bg-surface-light/40 border border-border/50 transition-all duration-200 select-none ${
          animating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/25">
            {current.category}
          </span>
          <span className="text-[10px] font-medium text-text-muted/70">
            {current.tag} • #{index + 1}/{FORMULA_VAULT.length}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-text mb-1.5">{current.title}</h4>

        {/* Highlighted formula snippet */}
        <div className="px-3 py-2 rounded-lg bg-surface border border-border/80 font-mono text-xs text-accent-light font-medium tracking-wide my-1 overflow-x-auto">
          {current.formula}
        </div>

        <p className="text-[11px] text-text-muted leading-relaxed mt-1">
          {current.notes}
        </p>
      </div>

      {/* Bottom Controls Strip: Prev / Quick Switch / Next with clean touch targets */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 shrink-0">
        <span className="text-[11px] text-text-muted">
          High-Yield Formula Vault
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-9 h-9 rounded-xl bg-surface-light hover:bg-border text-text flex items-center justify-center transition-all active:scale-95"
            title="Previous Formula"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="w-9 h-9 rounded-xl bg-surface-light hover:bg-border text-text flex items-center justify-center transition-all active:scale-95"
            title="Next Formula"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
