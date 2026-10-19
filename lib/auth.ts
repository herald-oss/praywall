import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { archivePrayersOwnedByUser } from "@/lib/prayers/archive";
import { PASSWORD_MAX_CHARS, PASSWORD_MIN_CHARS } from "@/lib/constants";
import { getTrustedOrigins } from "@/lib/http/origin";
import { trustedIpHeaders } from "@/lib/http/client-ip";

// Accounts are username + password only. Better-Auth needs an email, so
// signup/login use an internal `<username>@praywall.local` address that is
// never shown or emailed (see app/api/auth/signup and login).
//
// Only a few native HTTP endpoints are reachable — app/api/auth/[...all]
// enforces an allowlist, and disabledPaths below is a second layer. Everything
// else (sign-up, sign-in, update-user…) must go through our own routes, which
// apply username rules, the profanity filter, origin checks and rate limits.

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  trustedOrigins: getTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_CHARS,
    maxPasswordLength: PASSWORD_MAX_CHARS,
  },
  disabledPaths: [
    "/sign-up/email",
    "/sign-in/email",
    "/sign-in/anonymous",
    "/update-user",
    "/change-email",
    "/request-password-reset",
    "/reset-password",
    "/send-verification-email",
    "/verify-email",
    "/list-accounts",
    "/link-social",
    "/unlink-account",
  ],
  session: {
    // Session lookups hit the DB on every request otherwise. A signed cookie
    // cache for 5 minutes removes most of those queries.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: {
    ipAddress: { ipAddressHeaders: trustedIpHeaders() },
  },
  user: {
    additionalFields: {
      // Set atomically at signup (inside Better-Auth's own insert) instead of
      // a second UPDATE that could fail and leave an account with no username.
      username: { type: "string", required: false, input: true },
    },
    deleteUser: {
      enabled: true,
      // Runs BEFORE Better-Auth deletes the user row (not wrapped in
      // try/catch upstream) — if this throws, the account is NOT deleted,
      // so we never lose the archive trail.
      beforeDelete: async (user) => {
        await archivePrayersOwnedByUser(user.id);
      },
    },
  },
});
