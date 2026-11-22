// Competition settings. To change the dates, edit ONLY REGISTRATION_OPENS_AT below.
// Registration is open for exactly 14 days from that moment, then closes automatically.
// Set it to the real go-live moment, Cairo time (+02:00 in winter), e.g. "2026-12-01T12:00:00+02:00".
// While it is empty, the page shows "registration opens soon" and registration stays closed.
export const REGISTRATION_OPENS_AT = "";
export const REGISTRATION_DAYS = 14;

export const SCHEDULED = REGISTRATION_OPENS_AT !== "";
export const REGISTRATION_OPENS_MS = SCHEDULED ? new Date(REGISTRATION_OPENS_AT).getTime() : Infinity;
export const REGISTRATION_DEADLINE_MS = REGISTRATION_OPENS_MS + REGISTRATION_DAYS * 24 * 60 * 60 * 1000;


export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 4;

export type RegistrationStatus = "before" | "open" | "closed";

export function registrationStatus(now: number = Date.now()): RegistrationStatus {
  if (now < REGISTRATION_OPENS_MS) return "before";
  if (now < REGISTRATION_DEADLINE_MS) return "open";
  return "closed";
}

export function isRegistrationOpen(now: number = Date.now()): boolean {
  return registrationStatus(now) === "open";
}
