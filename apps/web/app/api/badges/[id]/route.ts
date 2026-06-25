export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, badges, scouts } from "@trailhead/db";
import { eq } from "drizzle-orm";
import { withAuth, ok, bad } from "@/lib/http";

async function owns(troopId: string, badgeId: string) {
  const db = getDb();
  const b = await db.query.badges.findFirst({ where: (x, { eq }) => eq(x.id, badgeId) });
  if (!b) return false;
  const s = await db.query.scouts.findFirst({ where: (x, { eq, and }) => and(eq(x.id, b.scoutId), eq(x.troopId, troopId)) });
  return !!s;
}

export const PATCH = withAuth(async (req: NextRequest, auth, ctx) => {
  const { id } = await ctx.params;
  if (!(await owns(auth.troopId, id))) return bad("Not found", 404);
  const body = await req.json().catch(() => ({}));
  const set: Record<string, unknown> = {};
  if ("given" in body) set.given = !!body.given;
  if ("name" in body) set.name = body.name;
  const [row] = await getDb().update(badges).set(set).where(eq(badges.id, id)).returning();
  return ok(row);
});

export const DELETE = withAuth(async (_req, auth, ctx) => {
  const { id } = await ctx.params;
  if (!(await owns(auth.troopId, id))) return bad("Not found", 404);
  await getDb().delete(badges).where(eq(badges.id, id));
  return ok({ deleted: true });
});
