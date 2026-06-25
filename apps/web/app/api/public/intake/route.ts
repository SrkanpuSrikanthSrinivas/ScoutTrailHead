export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, scouts, scoutEvents } from "@trailhead/db";
import { intakeSchema } from "@trailhead/core";
import { ok, bad } from "@/lib/http";

// Public: a parent submits a scout. Lands as "submitted" in the web-setup queue.
export async function POST(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
  if (!code) return bad("Missing troop code");
  const db = getDb();
  const troop = await db.query.troops.findFirst({ where: (t, { eq }) => eq(t.inviteCode, code) });
  if (!troop) return bad("This intake link isn't valid", 404);

  const parsed = intakeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Please fill in the scout name, your name, and a contact.");
  const { scoutName, type, parentName, contact, prior, note } = parsed.data;

  const [row] = await db.insert(scouts).values({
    troopId: troop.id, name: scoutName, type, parentName, contact, prior, status: "submitted",
  }).returning();
  await db.insert(scoutEvents).values({
    scoutId: row.id, actor: `Parent intake (${parentName})`, action: "Submitted via intake link", toStatus: "submitted", note,
  });
  return ok({ ok: true });
}
