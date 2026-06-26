import type { NextRequest } from "next/server";
import { getDb, sessions } from "@trailhead/db";

/** Records a login and returns the new session id (embedded in the token as `sid`). */
export async function startSession(userId: string, troopId: string, req: NextRequest): Promise<string> {
  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 400);
  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "").split(",")[0].trim();
  const [row] = await getDb().insert(sessions).values({ userId, troopId, ip, userAgent }).returning();
  return row.id;
}
