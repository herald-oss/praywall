export const PRAYER_MAX_CHARS = 280;
export const DISPLAY_NAME_MAX_CHARS = 30;
export const PASSWORD_MIN_CHARS = 8;
export const PASSWORD_MAX_CHARS = 128;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
export const INTERCESSOR_GOAL = 33;

export const PRAYER_CATEGORIES = [
  "general",
  "health",
  "family",
  "work",
  "spiritual",
  "gratitude",
] as const;

export type PrayerCategory = (typeof PRAYER_CATEGORIES)[number];
