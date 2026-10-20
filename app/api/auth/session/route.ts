import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { copySetCookies } from "@/lib/auth-cookies";

// Better-Auth's native session endpoint is blocked by the allowlist in
// app/api/auth/[...all]; this is the one the client calls on every page
// load. asResponse so Better-Auth's refreshed cookies (session expiry
// extension, 5-minute cookie cache) actually reach the browser.
export async function GET() {
  const authResponse = await auth.api.getSession({
    headers: await headers(),
    asResponse: true,
  });
  const data = authResponse.ok
    ? ((await authResponse.json()) as {
        user?: { id: string; name: string; username?: string | null };
      } | null)
    : null;

  const response = NextResponse.json({
    user: data?.user
      ? { id: data.user.id, username: data.user.username ?? "", name: data.user.name }
      : null,
  });
  copySetCookies(authResponse, response);
  return response;
}
