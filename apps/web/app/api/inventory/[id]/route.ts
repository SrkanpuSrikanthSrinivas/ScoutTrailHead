export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, inventory } from "@trailhead/db";
import { and, eq } from "drizzle-orm";
import { withAuth, ok, bad } from "@/lib/http";

export const PATCH = withAuth(async (req: NextRequest, auth, ctx) => {
  const { id } = await ctx.params;
  const db = getDb();
  const item = await db.query.inventory.findFirst({ where: (x, { eq, and }) => and(eq(x.id, id), eq(x.troopId, auth.troopId)) });
  if (!item) return bad("Not found", 404);
  const body = await req.json().catch(() => ({}));
  const set: Record<string, number | string> = {};
  if ("out" in body) set.out = Math.max(0, Math.min(item.total, Number(body.out)));
  if ("total" in body) set.total = Math.max(0, Number(body.total));
  if ("min" in body) set.min = Math.max(0, Number(body.min));
  if ("name" in body) set.name = String(body.name);
  const [row] = await db.update(inventory).set(set).where(eq(inventory.id, id)).returning();
  return ok(row);
});

export const DELETE = withAuth(async (_req, auth, ctx) => {
  const { id } = await ctx.params;
  await getDb().delete(inventory).where(and(eq(inventory.id, id), eq(inventory.troopId, auth.troopId)));
  return ok({ deleted: true });
});
