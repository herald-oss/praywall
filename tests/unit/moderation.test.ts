import { describe, expect, it } from "vitest";
import { containsProfanity, detectSpam, moderateText } from "@/lib/moderation";

describe("containsProfanity", () => {
  it.each([
    "puta",
    "puta123", // suffix bypass stays blocked (leading boundary only)
    "hijo de puta",
    "chinga tu madre",
    "no mames",
    "ptm",
    "wtf",
    "fuck",
    "f*ck",
  ])("blocks %j", (text) => {
    expect(containsProfanity(text)).toBe(true);
  });

  it.each([
    "Oren por mi familia",
    "Necesito oración por la salud de mi mamá",
    "concha de mar",
    "voy a coger el bus",
    "joder estoy cansado",
    "mamar",
    "assistant pastor",
    "class assignment",
    // Spanish color "negro" must never be treated as a slur.
    "mi perro negro",
    "un día negro",
  ])("allows %j", (text) => {
    expect(containsProfanity(text)).toBe(false);
  });
});

describe("detectSpam", () => {
  it.each([
    ["visit www.spam.com", "url"],
    ["go to example.com now", "url"],
    ["aaaaaaaaaaaa", "repeated_char"],
    ["hola hola hola hola hola", "repeated_word"],
    ["PLEASE PRAY FOR ME NOW PLEASE", "all_caps"],
  ])("flags %j as %s", (text, reason) => {
    expect(detectSpam(text)).toEqual({ isSpam: true, reason });
  });

  it.each(["Ora por mí", "Dr. Smith said 3.5 kg", "Oren por mi hijo, gracias"])(
    "does not flag %j",
    (text) => {
      expect(detectSpam(text).isSpam).toBe(false);
    }
  );
});

describe("moderateText", () => {
  it("rejects empty and whitespace-only text", () => {
    expect(moderateText("   ")).toEqual({ ok: false, code: "empty" });
  });

  it("rejects text over the max length", () => {
    expect(moderateText("x".repeat(281))).toEqual({ ok: false, code: "too_long" });
    expect(moderateText("x".repeat(31), { maxLen: 30 })).toEqual({ ok: false, code: "too_long" });
  });

  it("only checks spam when asked to", () => {
    expect(moderateText("visit www.spam.com").ok).toBe(true);
    expect(moderateText("visit www.spam.com", { checkSpam: true })).toEqual({ ok: false, code: "spam" });
  });

  it("accepts a normal prayer", () => {
    expect(moderateText("Oren por la salud de mi papá", { checkSpam: true })).toEqual({ ok: true });
  });
});
