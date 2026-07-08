import {
  DataSet,
  RegExpMatcher,
  pattern,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { ES_PROFANITY_TERMS, ES_MOCKERY_PHRASES } from "./moderation-wordlist";
import { PRAYER_MAX_CHARS } from "./constants";

export { PRAYER_MAX_CHARS };

export type ModerationCode =
  | "inappropriate_content"
  | "spam"
  | "too_long"
  | "empty";

export interface ModerationResult {
  ok: boolean;
  code?: ModerationCode;
}

export interface SpamResult {
  isSpam: boolean;
  reason?: string;
}

const dataset = new DataSet<{ originalWord: string }>().addAll(
  englishDataset
);

for (const term of ES_PROFANITY_TERMS) {
  dataset.addPhrase((phrase) =>
    // Leading boundary only (not trailing): obscenity treats ASCII digits as
    // word characters, so a trailing `|` would let suffix bypasses like
    // "puta123" or "puta_" slip through a whole-word `|term|` pattern.
    phrase.setMetadata({ originalWord: term }).addPattern(pattern`|${term}`)
  );
}

for (const phrase of ES_MOCKERY_PHRASES) {
  // Exact phrase, both boundaries: unlike single-word terms, these aren't
  // conjugated, so there's no inflection to catch by leaving the end open —
  // and the root word alone (e.g. "mamar") is often legitimate.
  dataset.addPhrase((p) =>
    p.setMetadata({ originalWord: phrase }).addPattern(pattern`|${phrase}|`)
  );
}

const matcher = new RegExpMatcher({
  ...dataset.build(),
  ...englishRecommendedTransformers,
});

export function containsProfanity(text: string): boolean {
  return matcher.hasMatch(text);
}

const URL_RE = /(https?:\/\/|www\.)\S+|\b\S+\.(com|net|org|xyz|ru|info|link|click|shop|top|biz)\b/i;
const REPEATED_CHAR_RE = /(.)\1{9,}/;
const REPEATED_WORD_RE = /\b(\w+)\b(?:\s+\1\b){4,}/i;

export function detectSpam(text: string): SpamResult {
  const trimmed = text.trim();

  if (URL_RE.test(trimmed)) {
    return { isSpam: true, reason: "url" };
  }

  if (REPEATED_CHAR_RE.test(trimmed)) {
    return { isSpam: true, reason: "repeated_char" };
  }

  if (REPEATED_WORD_RE.test(trimmed)) {
    return { isSpam: true, reason: "repeated_word" };
  }

  const alpha = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (alpha.length > 15) {
    const upper = alpha.replace(/[^A-ZÀ-Þ]/g, "");
    if (upper.length / alpha.length > 0.7) {
      return { isSpam: true, reason: "all_caps" };
    }
  }

  return { isSpam: false };
}

export function moderateText(
  text: string,
  opts?: { maxLen?: number; checkSpam?: boolean }
): ModerationResult {
  const maxLen = opts?.maxLen ?? PRAYER_MAX_CHARS;
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { ok: false, code: "empty" };
  }

  if (text.length > maxLen) {
    return { ok: false, code: "too_long" };
  }

  if (containsProfanity(trimmed)) {
    return { ok: false, code: "inappropriate_content" };
  }

  if (opts?.checkSpam && detectSpam(trimmed).isSpam) {
    return { ok: false, code: "spam" };
  }

  return { ok: true };
}
