export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, inventory } from "@trailhead/db";
import { eq } from "drizzle-orm";
import { inventorySchema } from "@trailhead/core";
import { withAuth, ok, bad } from "@/lib/http";

export const GET = withAuth(async (_req, auth) =>
  ok(await getDb().select().from(inventory).where(eq(inventory.troopId, auth.troopId))));

export const POST = withAuth(async (req: NextRequest, auth) => {
  const parsed = inventorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid item");
  const [row] = await getDb().insert(inventory)
    .values({ ...parsed.data, troopId: auth.troopId, out: 0 }).returning();
  return ok(row, 201);
});
