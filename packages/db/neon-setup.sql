-- ============================================================
--  Trailhead — Neon schema setup
--  Paste this whole file into the Neon SQL Editor and Run.
--  Safe to run more than once (CREATE ... IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scout_id" uuid NOT NULL,
	"name" text NOT NULL,
	"earned_date" date,
	"given" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"troop_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text DEFAULT '',
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"troop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"out" integer DEFAULT 0 NOT NULL,
	"min" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "scout_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scout_id" uuid NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"note" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "scouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"troop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"parent_name" text DEFAULT '',
	"contact" text DEFAULT '',
	"prior" text DEFAULT '',
	"rank" text DEFAULT '',
	"joined" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "troops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "troops_invite_code_unique" UNIQUE("invite_code")
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"troop_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'leader' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

DO $$ BEGIN
 ALTER TABLE "badges" ADD CONSTRAINT "badges_scout_id_scouts_id_fk" FOREIGN KEY ("scout_id") REFERENCES "public"."scouts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "faqs" ADD CONSTRAINT "faqs_troop_id_troops_id_fk" FOREIGN KEY ("troop_id") REFERENCES "public"."troops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "inventory" ADD CONSTRAINT "inventory_troop_id_troops_id_fk" FOREIGN KEY ("troop_id") REFERENCES "public"."troops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "scout_events" ADD CONSTRAINT "scout_events_scout_id_scouts_id_fk" FOREIGN KEY ("scout_id") REFERENCES "public"."scouts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "scouts" ADD CONSTRAINT "scouts_troop_id_troops_id_fk" FOREIGN KEY ("troop_id") REFERENCES "public"."troops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_troop_id_troops_id_fk" FOREIGN KEY ("troop_id") REFERENCES "public"."troops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "badges_scout_idx" ON "badges" USING btree ("scout_id");
CREATE INDEX IF NOT EXISTS "faqs_troop_idx" ON "faqs" USING btree ("troop_id");
CREATE INDEX IF NOT EXISTS "inventory_troop_idx" ON "inventory" USING btree ("troop_id");
CREATE INDEX IF NOT EXISTS "events_scout_idx" ON "scout_events" USING btree ("scout_id");
CREATE INDEX IF NOT EXISTS "scouts_troop_idx" ON "scouts" USING btree ("troop_id");
CREATE INDEX IF NOT EXISTS "scouts_status_idx" ON "scouts" USING btree ("status");
