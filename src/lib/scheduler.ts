/**
 * SM-2 Spaced Repetition Scheduler
 * Pure functions - no side effects, fully unit-testable.
 */

export interface CardScheduleState {
  ease: number;
  interval: number; // days
  repetitions: number;
  dueDate: number;  // timestamp
}

export type Rating = 1 | 2 | 3 | 4; // Again=1, Hard=2, Good=3, Easy=4

export interface ScheduleResult {
  ease: number;
  interval: number;
  repetitions: number;
  dueDate: number;
}

const MIN_EASE = 1.3;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/**
 * Calculate the next schedule for a card given a rating.
 * @param card Current card state
 * @param rating User's rating (1-4)
 * @param now Current timestamp (for testability)
 * @returns New card schedule state
 */
export function scheduleCard(
  card: CardScheduleState,
  rating: Rating,
  now: number = Date.now()
): ScheduleResult {
  let { ease, interval, repetitions } = card;

  switch (rating) {
    case 1: // Again
      repetitions = 0;
      interval = 0; // relearn in 10 minutes
      ease = Math.max(MIN_EASE, ease - 0.2);
      return {
        ease,
        interval,
        repetitions,
        dueDate: now + 10 * MINUTE_MS,
      };

    case 2: // Hard
      ease = Math.max(MIN_EASE, ease - 0.15);
      if (repetitions === 0) {
        interval = 1;
        repetitions = 1;
      } else {
        interval = Math.max(1, Math.round(interval * 1.2));
        repetitions += 1;
      }
      return {
        ease,
        interval,
        repetitions,
        dueDate: now + interval * DAY_MS,
      };

    case 3: // Good
      if (repetitions === 0) {
        interval = 1;
        repetitions = 1;
      } else if (repetitions === 1) {
        interval = 6;
        repetitions = 2;
      } else {
        interval = Math.round(interval * ease);
        repetitions += 1;
      }
      return {
        ease,
        interval,
        repetitions,
        dueDate: now + interval * DAY_MS,
      };

    case 4: // Easy
      if (repetitions === 0) {
        interval = 4;
        repetitions = 1;
      } else {
        interval = Math.round(interval * ease * 1.3);
        repetitions += 1;
      }
      ease = ease + 0.15;
      return {
        ease,
        interval,
        repetitions,
        dueDate: now + interval * DAY_MS,
      };

    default:
      throw new Error(`Invalid rating: ${rating}`);
  }
}

/**
 * Get the human-readable next interval for display on rating buttons.
 */
export function getNextIntervalText(
  card: CardScheduleState,
  rating: Rating
): string {
  const result = scheduleCard(card, rating, Date.now());
  if (rating === 1) return '10m';
  const days = result.interval;
  if (days === 0) return '10m';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/**
 * Check if a card is due for review.
 */
export function isDue(dueDate: number, now: number = Date.now()): boolean {
  return dueDate <= now;
}

/**
 * Create initial schedule state for a new card.
 */
export function createInitialSchedule(): CardScheduleState {
  return {
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: Date.now(),
  };
}
