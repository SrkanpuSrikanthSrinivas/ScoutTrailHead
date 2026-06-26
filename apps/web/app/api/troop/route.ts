export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, troops } from "@trailhead/db";
import { eq } from "drizzle-orm";
import { withAuth, ok, bad } from "@/lib/http";

// Rename the current troop (admin only).
export const PATCH = withAuth(async (req: NextRequest, auth) => {
  if (auth.role !== "admin") return bad("Only an admin can rename the troop", 403);
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (name.length < 2) return bad("Troop name is too short");
  const [row] = await getDb().update(troops).set({ name })
    .where(eq(troops.id, auth.troopId)).returning();
  return row ? ok({ id: row.id, name: row.name, inviteCode: row.inviteCode }) : bad("Not found", 404);
});
