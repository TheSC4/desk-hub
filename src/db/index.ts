import Dexie, { type EntityTable } from 'dexie';

// ─── Flashcard / Revise types ───

export interface Deck {
  id?: number;
  name: string;
  createdAt: number;
}

export interface Card {
  id?: number;
  deckId: number;
  front: string;
  back: string;
  frontImage?: Blob;
  backImage?: Blob;
  // SM-2 fields
  ease: number;       // starts at 2.5, min 1.3
  interval: number;   // days
  repetitions: number;
  dueDate: number;    // timestamp
  createdAt: number;
  updatedAt: number;
}

export interface ReviewLog {
  id?: number;
  cardId: number;
  rating: number; // 1=Again, 2=Hard, 3=Good, 4=Easy
  ease: number;
  interval: number;
  reviewedAt: number;
}

// ─── Syllabus types ───

export interface Subject {
  id?: number;
  name: string;
  order: number;
}

export interface Topic {
  id?: number;
  subjectId: number;
  name: string;
  completed: boolean;
  order: number;
}

// ─── Daily Targets ───

export interface DailyTarget {
  id?: number;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  order: number;
}

// ─── Pomodoro Settings ───

export interface PomodoroSettings {
  id?: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLong: number;
}

// ─── Database ───

export class DeskHubDB extends Dexie {
  decks!: EntityTable<Deck, 'id'>;
  cards!: EntityTable<Card, 'id'>;
  reviewLogs!: EntityTable<ReviewLog, 'id'>;
  subjects!: EntityTable<Subject, 'id'>;
  topics!: EntityTable<Topic, 'id'>;
  dailyTargets!: EntityTable<DailyTarget, 'id'>;
  pomodoroSettings!: EntityTable<PomodoroSettings, 'id'>;

  constructor() {
    super('DeskHubDB');
    this.version(1).stores({
      decks: '++id, name, createdAt',
      cards: '++id, deckId, dueDate, createdAt',
      reviewLogs: '++id, cardId, reviewedAt',
      subjects: '++id, name, order',
      topics: '++id, subjectId, completed, order',
      dailyTargets: '++id, date, order',
      pomodoroSettings: '++id',
    });
  }
}

export const db = new DeskHubDB();
