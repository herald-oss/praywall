import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { readVisitorId } from "@/lib/visitor";
import type { Requester } from "@/lib/prayers/serialize";

type CookieSource = { get(name: string): { value: string } | undefined };

/**
 * Who is making this request, derived only from server-side state (session
 * cookie + visitor cookie) — never from anything in the request body.
 */
export async function getRequester(cookies: CookieSource): Promise<
  Requester & { userName: string | null }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  return {
    userId: session?.user?.id ?? null,
    userName: session?.user?.name ?? null,
    visitorId: readVisitorId(cookies),
  };
}
