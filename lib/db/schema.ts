import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  unique,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Better-Auth tables ───────────────────────────────────────────
// These tables are required by Better-Auth. Field names follow
// Better-Auth conventions (camelCase mapped to snake_case via Drizzle).

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isAnonymous: boolean("is_anonymous").default(false),
  lang: text("lang").default("es"),
  avatarConfig: jsonb("avatar_config").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── App tables ───────────────────────────────────────────────────

export const prayers = pgTable(
  "prayers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    text: text("text").notNull(),
    displayName: text("display_name"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    visitorId: text("visitor_id"),
    isAnonymous: boolean("is_anonymous").default(true),
    category: text("category").default("general"),
    intercessorCount: integer("intercessor_count").notNull().default(0),
    goalReached: boolean("goal_reached").notNull().default(false),
    answeredAt: timestamp("answered_at"),
    // Set together with answeredAt when the owner marks a prayer as answered.
    testimony: text("testimony"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    clientRequestId: text("client_request_id").unique(),
    // NULL = visible en el muro. NOT NULL = archivada (borrada por el dueño o
    // por borrado de cuenta): displayName/visitorId/userId se limpian, pero
    // text/category/intercessorCount se conservan para estudio agregado.
    archivedAt: timestamp("archived_at"),
  },
  (t) => [
    // The wall: visible prayers, fewest intercessors first, newest first.
    index("prayers_wall_idx")
      .on(t.intercessorCount, t.createdAt.desc())
      .where(sql`${t.archivedAt} is null`),
    index("prayers_user_id_idx").on(t.userId),
    index("prayers_visitor_id_idx").on(t.visitorId),
  ]
);

export const intercessions = pgTable(
  "intercessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prayerId: uuid("prayer_id")
      .notNull()
      .references(() => prayers.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.prayerId, t.visitorId),
    // One intercession per account per prayer, even across devices.
    uniqueIndex("intercessions_prayer_user_unique")
      .on(t.prayerId, t.userId)
      .where(sql`${t.userId} is not null`),
    index("intercessions_visitor_created_idx").on(t.visitorId, t.createdAt),
    index("intercessions_user_id_idx").on(t.userId),
  ]
);

// ─── Types ────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type Prayer = typeof prayers.$inferSelect;
export type NewPrayer = typeof prayers.$inferInsert;
export type Intercession = typeof intercessions.$inferSelect;
