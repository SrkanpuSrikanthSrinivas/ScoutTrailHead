export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, scouts, badges, scoutEvents } from "@trailhead/db";
import { eq, inArray, asc } from "drizzle-orm";
import { scoutCreateSchema } from "@trailhead/core";
import { withAuth, ok, bad } from "@/lib/http";

export const GET = withAuth(async (_req, auth) => {
  const db = getDb();
  const rows = await db.select().from(scouts).where(eq(scouts.troopId, auth.troopId));
  const ids = rows.map((r) => r.id);
  const b = ids.length ? await db.select().from(badges).where(inArray(badges.scoutId, ids)) : [];
  const ev = ids.length ? await db.select().from(scoutEvents).where(inArray(scoutEvents.scoutId, ids)).orderBy(asc(scoutEvents.createdAt)) : [];
  const bBy = new Map<string, any[]>(); b.forEach((x) => (bBy.get(x.scoutId) ?? bBy.set(x.scoutId, []).get(x.scoutId)!).push(x));
  const eBy = new Map<string, any[]>(); ev.forEach((x) => (eBy.get(x.scoutId) ?? eBy.set(x.scoutId, []).get(x.scoutId)!).push(x));
  return ok(rows.map((s) => ({ ...s, badges: bBy.get(s.id) ?? [], events: eBy.get(s.id) ?? [] })));
});

export const POST = withAuth(async (req: NextRequest, auth) => {
  const parsed = scoutCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid scout");
  const { name, type, parentName, contact, prior } = parsed.data;
  const db = getDb();
  const me = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, auth.userId) });
  const [row] = await db.insert(scouts).values({
    troopId: auth.troopId, name, type, parentName, contact, prior, status: "submitted",
  }).returning();
  await db.insert(scoutEvents).values({ scoutId: row.id, actor: me?.name ?? "Committee", action: "Added by committee", toStatus: "submitted" });
  return ok({ ...row, badges: [], events: [] }, 201);
});
