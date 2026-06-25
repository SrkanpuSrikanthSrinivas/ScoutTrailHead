export const runtime = "nodejs";
import { clearAuthCookie } from "@/lib/auth";
import { ok } from "@/lib/http";
export async function POST() { await clearAuthCookie(); return ok({ ok: true }); }
