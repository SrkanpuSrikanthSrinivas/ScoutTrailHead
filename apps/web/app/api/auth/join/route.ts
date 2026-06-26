export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, users } from "@trailhead/db";
import { joinSchema } from "@trailhead/core";
import { signToken, setAuthCookie } from "@/lib/auth";
import { startSession } from "@/lib/session";
import { ok, bad } from "@/lib/http";

export async function POST(req: NextRequest) {
  const parsed = joinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid details");
  const { inviteCode, name, email, password } = parsed.data;
  const db = getDb();
  const troop = await db.query.troops.findFirst({ where: (t, { eq }) => eq(t.inviteCode, inviteCode.toUpperCase()) });
  if (!troop) return bad("That invite code doesn't match a troop", 404);
  const existing = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email.toLowerCase()) });
  if (existing) return bad("That email is already registered", 409);
  const [user] = await db.insert(users).values({
    troopId: troop.id, email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10), name, role: "leader",
  }).returning();
  const sid = await startSession(user.id, troop.id, req);
  const token = await signToken({ userId: user.id, troopId: troop.id, role: "leader", sid });
  await setAuthCookie(token);
  return ok({ token, user: { id: user.id, name, email, role: "leader" }, troop });
}
