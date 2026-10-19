import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Better-Auth's native session endpoint is blocked by the allowlist in
// app/api/auth/[...all]; this is the one the client uses. It returns only
// what the UI needs.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      username: session.user.username ?? "",
      name: session.user.name,
    },
  });
}
