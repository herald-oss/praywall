import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientIp } from "@/lib/http/client-ip";
import { enforceIpRateLimit } from "@/lib/http/rate";
import { HttpError } from "@/lib/http/errors";

const req = (headers: Record<string, string>) => new Request("http://x.test/", { headers });

describe("getClientIp", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads X-Real-IP by default and ignores X-Forwarded-For", () => {
    expect(getClientIp(req({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(getClientIp(req({ "x-forwarded-for": "1.2.3.4" }))).toBeNull();
  });

  it("supports a custom header and can be disabled", () => {
    vi.stubEnv("TRUSTED_IP_HEADER", "cf-connecting-ip");
    expect(getClientIp(req({ "cf-connecting-ip": "198.51.100.1" }))).toBe("198.51.100.1");
    vi.stubEnv("TRUSTED_IP_HEADER", "none");
    expect(getClientIp(req({ "x-real-ip": "203.0.113.7" }))).toBeNull();
  });
});

describe("enforceIpRateLimit", () => {
  it("unknown IPs share a much larger site-wide bucket, not the per-IP limit", () => {
    const prefix = `t:unknown:${Math.random()}`;
    for (let i = 0; i < 20; i++) {
      expect(() => enforceIpRateLimit(prefix, null, { limit: 1, windowMs: 60_000 })).not.toThrow();
    }
    expect(() => enforceIpRateLimit(prefix, null, { limit: 1, windowMs: 60_000 })).toThrow(HttpError);
  });

  it("limits known IPs", () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 200)}`;
    enforceIpRateLimit("t:known", ip, { limit: 1, windowMs: 60_000 });
    expect(() => enforceIpRateLimit("t:known", ip, { limit: 1, windowMs: 60_000 })).toThrow(HttpError);
  });
});
