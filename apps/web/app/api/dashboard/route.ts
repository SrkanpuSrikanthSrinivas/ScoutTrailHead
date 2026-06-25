export const runtime = "nodejs";
import { getDb, scouts, badges, inventory } from "@trailhead/db";
import { eq, inArray } from "drizzle-orm";
import { ownsQueue } from "@trailhead/core";
import { withAuth, ok } from "@/lib/http";

export const GET = withAuth(async (_req, auth) => {
  const db = getDb();
  const all = await db.select().from(scouts).where(eq(scouts.troopId, auth.troopId));
  const inv = await db.select().from(inventory).where(eq(inventory.troopId, auth.troopId));
  const roster = all.filter((s) => s.status === "active");
  const open = all.filter((s) => ["submitted", "web_setup", "finance"].includes(s.status));

  const rosterIds = roster.map((s) => s.id);
  let awarded = 0;
  if (rosterIds.length) {
    const b = await db.select().from(badges).where(inArray(badges.scoutId, rosterIds));
    awarded = b.filter((x) => x.given).length;
  }
  const low = inv.filter((i) => i.total - i.out <= i.min);

  return ok({
    activeCount: roster.length,
    pipelineCount: open.length,
    myActionCount: open.filter((s) => ownsQueue(s.status, auth.role)).length,
    statusCounts: {
      submitted: all.filter((s) => s.status === "submitted").length,
      web_setup: all.filter((s) => s.status === "web_setup").length,
      finance: all.filter((s) => s.status === "finance").length,
    },
    badgesAwarded: awarded,
    lowStock: low.map((i) => ({ id: i.id, name: i.name, category: i.category, available: i.total - i.out })),
    rankCounts: roster.reduce<Record<string, number>>((a, s) => { const r = s.rank || "Scout"; a[r] = (a[r] || 0) + 1; return a; }, {}),
  });
});
