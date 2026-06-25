export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, scouts, badges } from "@trailhead/db";
import { eq } from "drizzle-orm";
import { badgeSchema } from "@trailhead/core";
import { withAuth, ok, bad } from "@/lib/http";

export const POST = withAuth(async (req: NextRequest, auth, ctx) => {
  const { id } = await ctx.params;
  const db = getDb();
  const owner = await db.query.scouts.findFirst({ where: (x, { eq, and }) => and(eq(x.id, id), eq(x.troopId, auth.troopId)) });
  if (!owner) return bad("Not found", 404);
  const parsed = badgeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid badge");
  const [row] = await db.insert(badges).values({
    scoutId: id, name: parsed.data.name, earnedDate: parsed.data.earnedDate ?? null, given: parsed.data.given,
  }).returning();
  return ok(row, 201);
});
