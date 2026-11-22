// Competition settings. Change the deadline HERE, in one place only.
// Registration closes automatically at this moment (Cairo time, UTC+2).
// Rule: 2 weeks after the competition page goes live.
export const REGISTRATION_DEADLINE = "2026-12-07T23:59:00+02:00";

export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 4;

export function isRegistrationOpen(now: number = Date.now()): boolean {
  return now < new Date(REGISTRATION_DEADLINE).getTime();
}
