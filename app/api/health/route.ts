import { NextResponse } from "next/server";

// Railway healthcheck. Deliberately doesn't touch the database, so a brief
// DB hiccup doesn't make the platform restart a healthy web process.
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
