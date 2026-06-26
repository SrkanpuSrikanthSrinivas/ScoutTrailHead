import { pgTable, uuid, text, integer, boolean, timestamp, date, index } from "drizzle-orm/pg-core";

export const troops = pgTable("troops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  troopId: uuid("troop_id").notNull().references(() => troops.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // admin | web_setup | finance | leader
  role: text("role", { enum: ["admin", "web_setup", "finance", "leader"] }).notNull().default("leader"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Append-only sign-in log: one row per login; logoutAt stamped on sign-out. */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  troopId: uuid("troop_id").notNull().references(() => troops.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  loginAt: timestamp("login_at", { withTimezone: true }).defaultNow().notNull(),
  logoutAt: timestamp("logout_at", { withTimezone: true }),
  ip: text("ip").default(""),
  userAgent: text("user_agent").default(""),
}, (t) => ({ byTroop: index("sessions_troop_idx").on(t.troopId), byUser: index("sessions_user_idx").on(t.userId) }));

export const scouts = pgTable("scouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  troopId: uuid("troop_id").notNull().references(() => troops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["new", "transfer"] }).notNull(),
  // workflow gate: submitted → web_setup → finance → active (or declined)
  status: text("status", { enum: ["submitted", "web_setup", "finance", "active", "declined"] }).notNull().default("submitted"),
  parentName: text("parent_name").default(""),
  contact: text("contact").default(""),
  prior: text("prior").default(""),
  rank: text("rank").default(""),
  joined: date("joined"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byTroop: index("scouts_troop_idx").on(t.troopId), byStatus: index("scouts_status_idx").on(t.status) }));

/** Append-only audit trail: who moved a scout, when, and any note. */
export const scoutEvents = pgTable("scout_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  scoutId: uuid("scout_id").notNull().references(() => scouts.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),        // user name, or "Parent intake"
  action: text("action").notNull(),      // human-readable, e.g. "Sent to finance"
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  note: text("note").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byScout: index("events_scout_idx").on(t.scoutId) }));

export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  scoutId: uuid("scout_id").notNull().references(() => scouts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  earnedDate: date("earned_date"),
  given: boolean("given").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byScout: index("badges_scout_idx").on(t.scoutId) }));

export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  troopId: uuid("troop_id").notNull().references(() => troops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  total: integer("total").notNull().default(0),
  out: integer("out").notNull().default(0),
  min: integer("min").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byTroop: index("inventory_troop_idx").on(t.troopId) }));

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  troopId: uuid("troop_id").notNull().references(() => troops.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byTroop: index("faqs_troop_idx").on(t.troopId) }));
