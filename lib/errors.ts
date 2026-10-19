// Maps API error codes to translation keys under the "errors" namespace.
// Unknown codes fall back to a generic message — raw server text is never
// shown to the user.

const KNOWN_CODES = new Set([
  "invalid_credentials",
  "invalid_password",
  "username_taken",
  "name_required",
  "rate_limit",
  "inappropriate_content",
  "spam",
  "too_long",
  "empty",
  "invalid_input",
  "not_found",
  "sign_out_failed",
  "network",
  "password_too_short",
  "password_too_long",
]);

export type ErrorKey = `errors.${string}`;

export function errorMessageKey(code: string | undefined | null): ErrorKey {
  return code && KNOWN_CODES.has(code) ? `errors.${code}` : "errors.generic";
}

/** An API failure carrying the server's error code. */
export class ApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ApiError";
  }
}

/**
 * Reads `{ error: "code" }` from our routes, or Better-Auth's
 * `{ code: "INVALID_PASSWORD" }`, normalized to lower snake case.
 */
export async function readErrorCode(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown; code?: unknown };
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.code === "string") return data.code.toLowerCase();
  } catch {
    // non-JSON body
  }
  return res.status === 429 ? "rate_limit" : "generic";
}

/** Code for any thrown value (ApiError code, network failure, or generic). */
export function codeOf(error: unknown): string {
  if (error instanceof ApiError) return error.code;
  if (error instanceof TypeError) return "network";
  return "generic";
}
