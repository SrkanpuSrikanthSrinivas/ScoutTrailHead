import "dotenv/config";
import { getDb, troops, users, scouts, scoutEvents, inventory, faqs } from "./index";
import { DEFAULT_INVENTORY, DEFAULT_FAQ } from "@trailhead/core";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

/** Demo troop + one user per workflow role + a few scouts spread across the gates. */
async function main() {
  const db = getDb();
  const code = randomBytes(4).toString("hex").toUpperCase();
  const [troop] = await db.insert(troops).values({ name: "Demo Troop 100", inviteCode: code }).returning();

  const pw = await bcrypt.hash("password123", 10);
  await db.insert(users).values([
    { troopId: troop.id, email: "admin@example.com",   passwordHash: pw, name: "Troop Admin",   role: "admin" },
    { troopId: troop.id, email: "web@example.com",      passwordHash: pw, name: "Wendy Web",     role: "web_setup" },
    { troopId: troop.id, email: "finance@example.com",  passwordHash: pw, name: "Frank Finance", role: "finance" },
  ]);

  const demo: [string, "new" | "transfer", any, string][] = [
    ["Aiden Rao", "new", "submitted", "Submitted by parent"],
    ["Maya Chen", "new", "web_setup", "Started web setup"],
    ["Leo Park", "transfer", "finance", "Sent to finance"],
  ];
  for (const [name, type, status, action] of demo) {
    const [s] = await db.insert(scouts).values({
      troopId: troop.id, name, type, status,
      parentName: name.split(" ")[0] + "'s parent", contact: "parent@example.com",
      rank: type === "transfer" ? "First Class" : "",
    }).returning();
    await db.insert(scoutEvents).values({ scoutId: s.id, actor: "Parent intake", action: "Submitted via intake link", toStatus: "submitted" });
    if (status !== "submitted") await db.insert(scoutEvents).values({ scoutId: s.id, actor: "Wendy Web", action, toStatus: status });
  }

  // one already-approved scout on the roster
  const [active] = await db.insert(scouts).values({
    troopId: troop.id, name: "Sofia Nguyen", type: "new", status: "active", rank: "Tenderfoot", joined: new Date().toISOString().slice(0, 10),
  }).returning();
  await db.insert(scoutEvents).values({ scoutId: active.id, actor: "Frank Finance", action: "Payment confirmed — approved to roster", toStatus: "active" });

  await db.insert(inventory).values(DEFAULT_INVENTORY.map((i) => ({ ...i, troopId: troop.id })));
  await db.insert(faqs).values(DEFAULT_FAQ.map((f, idx) => ({ ...f, troopId: troop.id, position: idx })));

  console.log("Seeded troop:", troop.name);
  console.log("Logins (all password123):");
  console.log("  admin@example.com    (admin)");
  console.log("  web@example.com      (web setup)");
  console.log("  finance@example.com  (finance)");
  console.log("Invite code (committee join):", code);
  console.log("Public parent intake link:   /intake/" + code);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
