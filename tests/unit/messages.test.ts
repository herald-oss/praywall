import { describe, expect, it } from "vitest";
import es from "@/messages/es.json";
import en from "@/messages/en.json";

function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object"
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

describe("translations", () => {
  it("es and en define exactly the same keys", () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });

  it("no translation is empty", () => {
    for (const messages of [es, en]) {
      for (const key of keys(messages)) {
        const value = key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], messages);
        expect(value, key).not.toBe("");
      }
    }
  });
});
