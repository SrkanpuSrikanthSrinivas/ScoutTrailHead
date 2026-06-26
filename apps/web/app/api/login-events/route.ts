export const runtime = "nodejs";
import { getDb, sessions, users } from "@trailhead/db";
import { eq, desc } from "drizzle-orm";
import { withAuth, ok, bad } from "@/lib/http";

export const GET = withAuth(async (_req, auth) => {
  if (auth.role !== "admin") return bad("Admins only", 403);
  const db = getDb();
  const rows = await db.select().from(sessions).where(eq(sessions.troopId, auth.troopId))
    .orderBy(desc(sessions.loginAt)).limit(100);
  const people = await db.select().from(users).where(eq(users.troopId, auth.troopId));
  const byId = new Map(people.map((u) => [u.id, u]));
  return ok(rows.map((s) => {
    const u = byId.get(s.userId);
    return {
      id: s.id, name: u?.name ?? "—", email: u?.email ?? "", role: u?.role ?? "",
      loginAt: s.loginAt, logoutAt: s.logoutAt, ip: s.ip, userAgent: s.userAgent,
    };
  }));
});
