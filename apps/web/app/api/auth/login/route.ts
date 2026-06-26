export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@trailhead/db";
import { loginSchema } from "@trailhead/core";
import { signToken, setAuthCookie } from "@/lib/auth";
import { startSession } from "@/lib/session";
import { ok, bad } from "@/lib/http";

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid login");
  const { email, password } = parsed.data;
  const db = getDb();
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email.toLowerCase()) });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return bad("Wrong email or password", 401);
  const troop = await db.query.troops.findFirst({ where: (t, { eq }) => eq(t.id, user.troopId) });
  const sid = await startSession(user.id, user.troopId, req);
  const token = await signToken({ userId: user.id, troopId: user.troopId, role: user.role, sid });
  await setAuthCookie(token);
  return ok({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, troop });
}
