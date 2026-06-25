export const runtime = "nodejs";
import { getDb, users } from "@trailhead/db";
import { eq } from "drizzle-orm";
import { withAuth, ok, bad } from "@/lib/http";

export const GET = withAuth(async (_req, auth) => {
  if (auth.role !== "admin") return bad("Admins only", 403);
  const rows = await getDb().select().from(users).where(eq(users.troopId, auth.troopId));
  return ok(rows.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
});
