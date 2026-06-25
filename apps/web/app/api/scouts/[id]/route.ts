export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, scouts } from "@trailhead/db";
import { and, eq } from "drizzle-orm";
import { withAuth, ok, bad } from "@/lib/http";

export const PATCH = withAuth(async (req: NextRequest, auth, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};
  for (const k of ["name", "rank", "contact", "prior", "parentName", "joined"]) if (k in body) allowed[k] = body[k];
  const [row] = await getDb().update(scouts).set(allowed)
    .where(and(eq(scouts.id, id), eq(scouts.troopId, auth.troopId))).returning();
  return row ? ok(row) : bad("Not found", 404);
});

export const DELETE = withAuth(async (_req, auth, ctx) => {
  const { id } = await ctx.params;
  await getDb().delete(scouts).where(and(eq(scouts.id, id), eq(scouts.troopId, auth.troopId)));
  return ok({ deleted: true });
});
