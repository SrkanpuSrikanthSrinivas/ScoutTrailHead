export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb } from "@trailhead/db";
import { ok, bad } from "@/lib/http";

// Public: resolve a troop name from its intake code (for the intake page header).
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
  if (!code) return bad("Missing code");
  const troop = await getDb().query.troops.findFirst({ where: (t, { eq }) => eq(t.inviteCode, code) });
  return troop ? ok({ name: troop.name }) : bad("Unknown troop", 404);
}
