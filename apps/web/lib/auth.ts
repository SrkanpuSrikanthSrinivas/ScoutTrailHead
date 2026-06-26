import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { AuthClaims } from "@trailhead/core";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-insecure-secret");
const COOKIE = "trailhead_token";

export async function signToken(claims: AuthClaims): Promise<string> {
  return new SignJWT(claims as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<AuthClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: String(payload.userId), troopId: String(payload.troopId), role: payload.role as AuthClaims["role"], sid: payload.sid ? String(payload.sid) : undefined };
  } catch {
    return null;
  }
}

/** Reads the token from the httpOnly cookie (web) OR Authorization: Bearer (mobile). */
export async function getAuth(req: NextRequest): Promise<AuthClaims | null> {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return verifyToken(header.slice(7));
  const jar = await cookies();
  const c = jar.get(COOKIE)?.value;
  return c ? verifyToken(c) : null;
}

export async function setAuthCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}
export async function clearAuthCookie() {
  (await cookies()).delete(COOKIE);
}
