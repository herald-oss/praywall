// Tunable limits. Defaults are generous on purpose: a whole church can share
// one Wi-Fi IP, and blocking a real congregation is worse than letting a
// little spam through. Every value can be overridden with an env var.

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface Limit {
  limit: number;
  windowMs: number;
}

export const LIMITS = {
  prayerPerIp: { limit: envInt("RL_PRAYER_PER_IP", 10), windowMs: MINUTE },
  prayerPerVisitor: { limit: envInt("RL_PRAYER_PER_VISITOR", 5), windowMs: MINUTE },
  intercedePerIp: { limit: envInt("RL_INTERCEDE_PER_IP", 120), windowMs: MINUTE },
  intercedePerIpPerPrayer: {
    limit: envInt("RL_INTERCEDE_PER_IP_PER_PRAYER", 40),
    windowMs: DAY,
  },
  managePerRequester: { limit: envInt("RL_MANAGE", 10), windowMs: MINUTE },
  loginPerIp: { limit: envInt("RL_LOGIN_PER_IP", 20), windowMs: 15 * MINUTE },
  loginPerUsername: { limit: envInt("RL_LOGIN_PER_USERNAME", 5), windowMs: 15 * MINUTE },
  signupPerIp: { limit: envInt("RL_SIGNUP_PER_IP", 10), windowMs: HOUR },
  checkUsernamePerIp: { limit: envInt("RL_CHECK_USERNAME_PER_IP", 60), windowMs: MINUTE },
  profilePerUser: { limit: envInt("RL_PROFILE", 10), windowMs: 15 * MINUTE },
} satisfies Record<string, Limit>;

export const MAX_JSON_BYTES = envInt("MAX_JSON_BYTES", 16 * 1024);
