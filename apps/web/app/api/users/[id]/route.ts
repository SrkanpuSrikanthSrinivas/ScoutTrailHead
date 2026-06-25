export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, users } from "@trailhead/db";
import { and, eq } from "drizzle-orm";
import { roleSchema } from "@trailhead/core";
import { withAuth, ok, bad } from "@/lib/http";

export const PATCH = withAuth(async (req: NextRequest, auth, ctx) => {
  if (auth.role !== "admin") return bad("Admins only", 403);
  const { id } = await ctx.params;
  if (id === auth.userId) return bad("You can't change your own role", 400);
  const parsed = roleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid role");
  const [row] = await getDb().update(users).set({ role: parsed.data.role })
    .where(and(eq(users.id, id), eq(users.troopId, auth.troopId))).returning();
  return row ? ok({ id: row.id, name: row.name, email: row.email, role: row.role }) : bad("Not found", 404);
});
