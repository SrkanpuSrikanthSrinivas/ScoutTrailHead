import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "./auth";
import type { AuthClaims } from "@trailhead/core";

export const ok = (data: unknown, init?: number) => NextResponse.json(data, { status: init ?? 200 });
export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

/** Wraps a handler so it only runs for an authenticated request. */
export function withAuth(
  handler: (req: NextRequest, auth: AuthClaims, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const auth = await getAuth(req);
    if (!auth) return bad("Not authenticated", 401);
    try {
      return await handler(req, auth, ctx);
    } catch (e) {
      console.error(e);
      return bad("Server error", 500);
    }
  };
}
