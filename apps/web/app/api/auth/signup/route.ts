export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getDb, troops, users, inventory, faqs } from "@trailhead/db";
import { signupSchema, DEFAULT_INVENTORY, DEFAULT_FAQ } from "@trailhead/core";
import { signToken, setAuthCookie } from "@/lib/auth";
import { startSession } from "@/lib/session";
import { ok, bad } from "@/lib/http";

export async function POST(req: NextRequest) {
  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid sign-up details");
  const { troopName, name, email, password } = parsed.data;
  const db = getDb();

  const existing = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email.toLowerCase()) });
  if (existing) return bad("That email is already registered", 409);

  const code = randomBytes(4).toString("hex").toUpperCase();
  const [troop] = await db.insert(troops).values({ name: troopName, inviteCode: code }).returning();
  const [user] = await db.insert(users).values({
    troopId: troop.id, email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10), name, role: "admin",
  }).returning();

  await db.insert(inventory).values(DEFAULT_INVENTORY.map((i) => ({ ...i, troopId: troop.id })));
  await db.insert(faqs).values(DEFAULT_FAQ.map((f, idx) => ({ ...f, troopId: troop.id, position: idx })));

  const sid = await startSession(user.id, troop.id, req);
  const token = await signToken({ userId: user.id, troopId: troop.id, role: "admin", sid });
  await setAuthCookie(token);
  return ok({ token, user: { id: user.id, name, email, role: "admin" }, troop: { id: troop.id, name: troopName, inviteCode: code } });
}
