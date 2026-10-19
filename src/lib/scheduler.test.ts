import { describe, it, expect } from 'vitest';
import { scheduleCard, getNextIntervalText, isDue, createInitialSchedule, type CardScheduleState, type Rating } from './scheduler';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const NOW = 1700000000000; // fixed timestamp for testing

function makeCard(overrides: Partial<CardScheduleState> = {}): CardScheduleState {
  return {
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: NOW,
    ...overrides,
  };
}

describe('SM-2 Scheduler', () => {
  describe('Again (rating=1)', () => {
    it('resets repetitions to 0 and schedules 10min relearn', () => {
      const card = makeCard({ repetitions: 3, interval: 10 });
      const result = scheduleCard(card, 1, NOW);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(0);
      expect(result.dueDate).toBe(NOW + 10 * MINUTE_MS);
    });

    it('decreases ease by 0.2 but not below 1.3', () => {
      const card = makeCard({ ease: 1.4 });
      const result = scheduleCard(card, 1, NOW);
      expect(result.ease).toBeCloseTo(1.3);
    });

    it('clamps ease at 1.3', () => {
      const card = makeCard({ ease: 1.3 });
      const result = scheduleCard(card, 1, NOW);
      expect(result.ease).toBe(1.3);
    });
  });

  describe('Hard (rating=2)', () => {
    it('first review: interval=1, reps=1', () => {
      const card = makeCard();
      const result = scheduleCard(card, 2, NOW);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      expect(result.dueDate).toBe(NOW + 1 * DAY_MS);
    });

    it('subsequent review: interval x 1.2', () => {
      const card = makeCard({ repetitions: 2, interval: 10 });
      const result = scheduleCard(card, 2, NOW);
      expect(result.interval).toBe(12); // 10 * 1.2
      expect(result.repetitions).toBe(3);
    });

    it('decreases ease by 0.15', () => {
      const card = makeCard({ ease: 2.5 });
      const result = scheduleCard(card, 2, NOW);
      expect(result.ease).toBeCloseTo(2.35);
    });
  });

  describe('Good (rating=3)', () => {
    it('first review: interval=1, reps=1', () => {
      const card = makeCard();
      const result = scheduleCard(card, 3, NOW);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('second review: interval=6, reps=2', () => {
      const card = makeCard({ repetitions: 1, interval: 1 });
      const result = scheduleCard(card, 3, NOW);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('third+ review: interval x ease', () => {
      const card = makeCard({ repetitions: 2, interval: 6, ease: 2.5 });
      const result = scheduleCard(card, 3, NOW);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
      expect(result.repetitions).toBe(3);
    });

    it('preserves ease', () => {
      const card = makeCard({ ease: 2.3 });
      const result = scheduleCard(card, 3, NOW);
      expect(result.ease).toBeCloseTo(2.3);
    });
  });

  describe('Easy (rating=4)', () => {
    it('first review: interval=4, reps=1', () => {
      const card = makeCard();
      const result = scheduleCard(card, 4, NOW);
      expect(result.interval).toBe(4);
      expect(result.repetitions).toBe(1);
    });

    it('subsequent review: interval x ease x 1.3', () => {
      const card = makeCard({ repetitions: 2, interval: 6, ease: 2.5 });
      const result = scheduleCard(card, 4, NOW);
      expect(result.interval).toBe(20); // round(6 * 2.5 * 1.3) = 19.5 -> 20
      expect(result.repetitions).toBe(3);
    });

    it('increases ease by 0.15', () => {
      const card = makeCard({ ease: 2.5 });
      const result = scheduleCard(card, 4, NOW);
      expect(result.ease).toBeCloseTo(2.65);
    });
  });

  describe('Edge cases', () => {
    it('throws on invalid rating', () => {
      const card = makeCard();
      expect(() => scheduleCard(card, 0 as Rating, NOW)).toThrow('Invalid rating');
      expect(() => scheduleCard(card, 5 as Rating, NOW)).toThrow('Invalid rating');
    });

    it('minimum interval is 1 for Hard with existing reviews', () => {
      const card = makeCard({ repetitions: 1, interval: 1 });
      const result = scheduleCard(card, 2, NOW);
      expect(result.interval).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('getNextIntervalText', () => {
  it('returns 10m for Again', () => {
    const card = makeCard();
    expect(getNextIntervalText(card, 1)).toBe('10m');
  });

  it('returns day format', () => {
    const card = makeCard();
    expect(getNextIntervalText(card, 3)).toBe('1d');
  });

  it('returns multi-day format', () => {
    const card = makeCard({ repetitions: 2, interval: 6, ease: 2.5 });
    expect(getNextIntervalText(card, 3)).toBe('15d');
  });
});

describe('isDue', () => {
  it('returns true if due date is in the past', () => {
    expect(isDue(NOW - 1000, NOW)).toBe(true);
  });

  it('returns true if due date is now', () => {
    expect(isDue(NOW, NOW)).toBe(true);
  });

  it('returns false if due date is in the future', () => {
    expect(isDue(NOW + 1000, NOW)).toBe(false);
  });
});

describe('createInitialSchedule', () => {
  it('creates schedule with default values', () => {
    const schedule = createInitialSchedule();
    expect(schedule.ease).toBe(2.5);
    expect(schedule.interval).toBe(0);
    expect(schedule.repetitions).toBe(0);
    expect(schedule.dueDate).toBeLessThanOrEqual(Date.now());
  });
});
