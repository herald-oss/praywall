import type { APIRequestContext, APIResponse, PlaywrightWorkerArgs } from "@playwright/test";
import { uniqueIp } from "./net";

export const BASE_URL = `http://localhost:${process.env.PW_PORT ?? 3100}`;

/** A fresh cookie jar acting as one browser on its own IP. */
export async function newClient(
  playwright: PlaywrightWorkerArgs["playwright"],
  opts: { ip?: string; cookie?: string } = {}
): Promise<APIRequestContext> {
  return playwright.request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      "x-real-ip": opts.ip ?? uniqueIp(),
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
    },
  });
}

export function uniqueUsername(prefix = "u"): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`.slice(0, 20);
}

export async function signup(
  client: APIRequestContext,
  data: { username: string; password?: string; displayName?: string }
): Promise<APIResponse> {
  return client.post("/api/auth/signup", {
    data: {
      username: data.username,
      password: data.password ?? "password123",
      displayName: data.displayName ?? "Ana",
    },
    headers: { origin: BASE_URL },
  });
}

export async function login(
  client: APIRequestContext,
  username: string,
  password = "password123"
): Promise<APIResponse> {
  return client.post("/api/auth/login", {
    data: { username, password },
    headers: { origin: BASE_URL },
  });
}

export function setCookieHeaders(res: APIResponse): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);
}
