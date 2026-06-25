export const runtime = "nodejs";
import { getDb } from "@trailhead/db";
import { withAuth, ok, bad } from "@/lib/http";

export const GET = withAuth(async (_req, auth) => {
  const db = getDb();
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, auth.userId) });
  if (!user) return bad("User not found", 404);
  const troop = await db.query.troops.findFirst({ where: (t, { eq }) => eq(t.id, auth.troopId) });
  return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, troop });
});
