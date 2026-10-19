import { db } from './index';

const GATE_CSE_SYLLABUS: { name: string; topics: string[] }[] = [
  {
    name: 'Engineering Mathematics',
    topics: ['Discrete Math', 'Linear Algebra', 'Calculus', 'Probability & Statistics'],
  },
  { name: 'Digital Logic', topics: ['Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits', 'Number Representations'] },
  { name: 'Computer Organization & Architecture', topics: ['Machine Instructions', 'ALU', 'Data Path', 'Pipelining', 'Memory Hierarchy', 'I/O Interface'] },
  { name: 'Programming & Data Structures', topics: ['C Programming', 'Arrays & Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs', 'Hashing'] },
  { name: 'Algorithms', topics: ['Asymptotic Analysis', 'Searching & Sorting', 'Graph Algorithms', 'Greedy', 'Dynamic Programming', 'NP-Completeness'] },
  { name: 'Theory of Computation', topics: ['Regular Languages & FA', 'Context-Free Grammars', 'Turing Machines', 'Undecidability'] },
  { name: 'Compiler Design', topics: ['Lexical Analysis', 'Parsing', 'Syntax-Directed Translation', 'Code Generation & Optimization'] },
  { name: 'Operating Systems', topics: ['Processes & Threads', 'CPU Scheduling', 'Synchronization', 'Deadlocks', 'Memory Management', 'File Systems'] },
  { name: 'Databases', topics: ['ER Model', 'Relational Model', 'SQL', 'Normalization', 'Transactions & Concurrency', 'Indexing'] },
  { name: 'Computer Networks', topics: ['OSI & TCP/IP Models', 'Data Link Layer', 'Network Layer & Routing', 'Transport Layer', 'Application Layer'] },
  { name: 'General Aptitude', topics: ['Verbal Ability', 'Numerical Ability'] },
];

export async function seedDatabase(): Promise<void> {
  // Only seed if no subjects exist yet
  const count = await db.subjects.count();
  if (count > 0) return;

  // Seed subjects and topics
  for (let i = 0; i < GATE_CSE_SYLLABUS.length; i++) {
    const { name, topics } = GATE_CSE_SYLLABUS[i];
    const subjectId = await db.subjects.add({ name, order: i });
    for (let j = 0; j < topics.length; j++) {
      await db.topics.add({
        subjectId: subjectId as number,
        name: topics[j],
        completed: false,
        order: j,
      });
    }
  }

  // Seed default pomodoro settings
  const pomoCount = await db.pomodoroSettings.count();
  if (pomoCount === 0) {
    await db.pomodoroSettings.add({
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLong: 4,
    });
  }

  // Seed default virtual pet
  const petCount = await db.pet.count();
  if (petCount === 0) {
    await db.pet.add({
      name: 'Pixel',
      type: 'owl',
      level: 1,
      xp: 25,
      energy: 90,
      happiness: 85,
      lastInteracted: Date.now(),
      totalStudyMinutes: 0,
    });
  }
}
