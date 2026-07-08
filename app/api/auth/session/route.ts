import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// Better-Auth's native session endpoint is /api/auth/get-session, not
// /api/auth/session — this wrapper exists because the client expects
// /api/auth/session and because `username` isn't a Better-Auth
// additionalField, so it never comes back from the native endpoint (same
// reason signup/login re-query it manually instead of trusting the raw
// Better-Auth response).
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ user: null });
  }

  const [row] = await db
    .select({ username: user.username, name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return NextResponse.json({
    user: {
      id: session.user.id,
      username: row?.username ?? "",
      name: row?.name ?? session.user.name,
    },
  });
}
