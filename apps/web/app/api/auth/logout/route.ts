export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { getDb, sessions } from "@trailhead/db";
import { getAuth, clearAuthCookie } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth?.sid) {
    // stamp logout time on this session (only if not already closed)
    await getDb().update(sessions).set({ logoutAt: new Date() })
      .where(and(eq(sessions.id, auth.sid), isNull(sessions.logoutAt)));
  }
  await clearAuthCookie();
  return ok({ ok: true });
}
