import { NextResponse } from "next/server";

/**
 * An expected, client-facing failure. `code` is a stable machine-readable
 * string the UI maps to a translated message (see lib/errors.ts) — never a
 * human sentence, so the server never leaks English text into a Spanish UI.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly headers?: Record<string, string>
  ) {
    super(code);
    this.name = "HttpError";
  }
}

export function errorResponse(error: unknown, logLabel: string): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.status, headers: error.headers }
    );
  }
  console.error(`${logLabel}:`, error);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
