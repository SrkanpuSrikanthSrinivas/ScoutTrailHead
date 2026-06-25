export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, scouts, scoutEvents } from "@trailhead/db";
import { eq } from "drizzle-orm";
import { transitionSchema, ACTIONS, RANKS } from "@trailhead/core";
import { withAuth, ok, bad } from "@/lib/http";

export const POST = withAuth(async (req: NextRequest, auth, ctx) => {
  const { id } = await ctx.params;
  const parsed = transitionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid transition");
  const { to, note } = parsed.data;
  const db = getDb();

  const s = await db.query.scouts.findFirst({ where: (x, { eq, and }) => and(eq(x.id, id), eq(x.troopId, auth.troopId)) });
  if (!s) return bad("Not found", 404);

  // Validate the move is legal AND that this role is allowed to make it.
  const action = ACTIONS.find((a) => a.from === s.status && a.to === to);
  if (!action) return bad(`Can't move from ${s.status} to ${to}`, 409);
  if (!(action.roles as readonly string[]).includes(auth.role))
    return bad(`Your role (${auth.role}) can't do that. This step is for: ${action.roles.join(", ")}.`, 403);

  const me = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, auth.userId) });
  const patch: Record<string, unknown> = { status: to };
  if (to === "active") {
    patch.joined = s.joined ?? new Date().toISOString().slice(0, 10);
    if (!s.rank) patch.rank = RANKS[0];
  }
  const [row] = await db.update(scouts).set(patch).where(eq(scouts.id, id)).returning();
  await db.insert(scoutEvents).values({
    scoutId: id, actor: me?.name ?? auth.role, action: action.label, fromStatus: s.status, toStatus: to, note,
  });
  return ok(row);
});
