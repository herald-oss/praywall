import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { archivePrayersOwnedByUser } from "@/lib/prayers/archive";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  plugins: [anonymous()],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
      // Runs BEFORE Better-Auth deletes the user row (not wrapped in
      // try/catch upstream) — if this throws, the account is NOT deleted,
      // so we never lose the archive trail. The user row still exists here,
      // so archivePrayersOwnedByUser can still match on userId; it clears
      // userId itself, so the FK onDelete:"set null" that fires right after
      // has nothing left to do.
      beforeDelete: async (user) => {
        await archivePrayersOwnedByUser(user.id);
      },
    },
  },
});
