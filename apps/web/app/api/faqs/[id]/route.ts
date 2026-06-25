export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, faqs } from "@trailhead/db";
import { and, eq } from "drizzle-orm";
import { withAuth, ok, bad } from "@/lib/http";

export const PATCH = withAuth(async (req: NextRequest, auth, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const set: Record<string, string> = {};
  if ("question" in body) set.question = String(body.question);
  if ("answer" in body) set.answer = String(body.answer);
  const [row] = await getDb().update(faqs).set(set)
    .where(and(eq(faqs.id, id), eq(faqs.troopId, auth.troopId))).returning();
  return row ? ok(row) : bad("Not found", 404);
});

export const DELETE = withAuth(async (_req, auth, ctx) => {
  const { id } = await ctx.params;
  await getDb().delete(faqs).where(and(eq(faqs.id, id), eq(faqs.troopId, auth.troopId)));
  return ok({ deleted: true });
});
