export const runtime = "nodejs";
import { type NextRequest } from "next/server";
import { getDb, faqs } from "@trailhead/db";
import { eq, asc } from "drizzle-orm";
import { faqSchema } from "@trailhead/core";
import { withAuth, ok, bad } from "@/lib/http";

export const GET = withAuth(async (_req, auth) =>
  ok(await getDb().select().from(faqs).where(eq(faqs.troopId, auth.troopId)).orderBy(asc(faqs.position))));

export const POST = withAuth(async (req: NextRequest, auth) => {
  const parsed = faqSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid question");
  const existing = await getDb().select().from(faqs).where(eq(faqs.troopId, auth.troopId));
  const [row] = await getDb().insert(faqs)
    .values({ ...parsed.data, troopId: auth.troopId, position: existing.length }).returning();
  return ok(row, 201);
});
