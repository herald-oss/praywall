import { z } from "zod";
import {
  DISPLAY_NAME_MAX_CHARS,
  PASSWORD_MAX_CHARS,
  PASSWORD_MIN_CHARS,
  PRAYER_CATEGORIES,
  PRAYER_MAX_CHARS,
  USERNAME_REGEX,
} from "@/lib/constants";
import { HttpError } from "@/lib/http/errors";

// Permissive UUID shape (any version) — matches ids from gen_random_uuid()
// and crypto.randomUUID() without rejecting valid rows.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export const uuidSchema = z.string().regex(UUID_RE);

export const createPrayerSchema = z.object({
  text: z.string().max(PRAYER_MAX_CHARS * 2),
  name: z.string().max(DISPLAY_NAME_MAX_CHARS * 2).nullish(),
  isAnonymous: z.boolean().default(true),
  category: z.enum(PRAYER_CATEGORIES).catch("general"),
  clientRequestId: z
    .string()
    .regex(/^[A-Za-z0-9-]{8,64}$/)
    .nullish(),
});

export const intercedeSchema = z.object({ prayerId: uuidSchema });

export const testimonySchema = z.object({
  testimony: z.string().max(PRAYER_MAX_CHARS * 2),
});

export const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(PASSWORD_MAX_CHARS),
});

export const signupSchema = z.object({
  username: z.string().regex(USERNAME_REGEX),
  password: z.string().min(PASSWORD_MIN_CHARS).max(PASSWORD_MAX_CHARS),
  displayName: z.string().max(DISPLAY_NAME_MAX_CHARS * 2),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(DISPLAY_NAME_MAX_CHARS * 2),
});

/** Parses or throws a 400 `invalid_input` — never echoes zod's messages. */
export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(400, "invalid_input");
  return result.data;
}
