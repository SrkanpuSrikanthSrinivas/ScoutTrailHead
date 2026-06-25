import { z } from "zod";

/** Scouts BSA rank ladder (lowest → highest). Swap here for Cub Scouts etc. */
export const RANKS = [
  "Scout", "Tenderfoot", "Second Class", "First Class", "Star", "Life", "Eagle",
] as const;
export type Rank = (typeof RANKS)[number];

export const SCOUT_TYPES = ["new", "transfer"] as const;
export type ScoutType = (typeof SCOUT_TYPES)[number];

/* ============================================================
   ROLES — who can do what in the intake workflow
   ============================================================ */
export const ROLES = ["admin", "web_setup", "finance", "leader"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin", web_setup: "Web Setup", finance: "Finance", leader: "Leader",
};
export const ROLE_BLURB: Record<Role, string> = {
  admin: "Full access; manages the team and can act on every stage.",
  web_setup: "Handles new intake: Scoutbook, comms, records — then sends to finance.",
  finance: "Confirms registration fees and dues are paid, then approves to the roster.",
  leader: "Can view the roster, pipeline, and gear. Cannot move scouts through the gates.",
};

/* ============================================================
   INTAKE WORKFLOW — a role-gated approval chain
   submitted → web_setup → finance → active   (+ declined)
   ============================================================ */
export type Status = "submitted" | "web_setup" | "finance" | "active" | "declined";

/** The visible "trail" of gates a scout passes through. */
export const STATUS_FLOW = ["submitted", "web_setup", "finance", "active"] as const;

export const STATUS_META: Record<Status, { label: string; short: string; owner: Role | null; desc: string }> = {
  submitted: { label: "Submitted", short: "Submitted", owner: "web_setup",
    desc: "A parent submitted the intake. Waiting for the web setup committee to pick it up." },
  web_setup: { label: "Web Setup", short: "Web Setup", owner: "web_setup",
    desc: "Committee sets up Scoutbook, comms, and records. For transfers, capture current rank & badges, then send to finance." },
  finance: { label: "Finance / Payment", short: "Finance", owner: "finance",
    desc: "Confirm national + council fees and troop dues are paid. This is the gate before the roster." },
  active: { label: "Approved — on roster", short: "Approved", owner: null,
    desc: "Payment confirmed. The scout is on the active roster." },
  declined: { label: "Declined", short: "Declined", owner: null,
    desc: "This intake was declined." },
};

/** Every legal transition, who may perform it, and how it reads in the UI. */
export const ACTIONS = [
  { from: "submitted", to: "web_setup", roles: ["web_setup", "admin"], label: "Start web setup", kind: "forward" },
  { from: "web_setup", to: "finance",   roles: ["web_setup", "admin"], label: "Send to finance", kind: "forward" },
  { from: "finance",   to: "active",    roles: ["finance", "admin"],   label: "Confirm payment & approve", kind: "forward" },
  { from: "finance",   to: "web_setup", roles: ["finance", "admin"],   label: "Send back to web setup", kind: "back" },
  { from: "web_setup", to: "submitted", roles: ["web_setup", "admin"], label: "Return to queue", kind: "back" },
  { from: "submitted", to: "declined",  roles: ["web_setup", "admin"], label: "Decline", kind: "decline" },
  { from: "web_setup", to: "declined",  roles: ["web_setup", "admin"], label: "Decline", kind: "decline" },
  { from: "finance",   to: "declined",  roles: ["finance", "admin"],   label: "Decline", kind: "decline" },
] as const;
export type Action = (typeof ACTIONS)[number];

/** Actions a given role can take on a scout in a given status. */
export const actionsFor = (status: string, role: string): Action[] =>
  ACTIONS.filter((a) => a.from === status && (a.roles as readonly string[]).includes(role));

/** Is this scout in *my* queue right now (the stage my role owns)? Admin owns all open stages. */
export const ownsQueue = (status: string, role: string): boolean =>
  role === "admin"
    ? ["submitted", "web_setup", "finance"].includes(status)
    : STATUS_META[status as Status]?.owner === role;

/** Who is the scout currently waiting on? */
export const waitingOn = (status: string): string => {
  const owner = STATUS_META[status as Status]?.owner;
  return owner ? ROLE_LABEL[owner] : "—";
};

export const INV_CATEGORIES = ["Merit Badges", "Tents", "Flags", "Equipment"] as const;
export type InvCategory = (typeof INV_CATEGORIES)[number];

export const DEFAULT_FAQ: { question: string; answer: string }[] = [
  { question: "How does my child join the troop?", answer: "Use the troop's online intake link to submit your scout's details. The request goes to our web setup committee to get records and accounts ready, then to finance to confirm fees. Once payment clears, your scout is added to the active roster." },
  { question: "What does it cost to register?", answer: "There's an annual BSA national fee plus a council fee, and our troop has modest annual dues covering advancement awards, activities, and equipment. Ask the committee for this year's exact figures — financial aid is available so cost is never a barrier." },
  { question: "My child is transferring from another troop — what's different?", answer: "Transfers keep their rank and earned merit badges. During web setup we pull records from Scoutbook so advancement carries over. Bring the prior unit number and BSA member ID if you have them." },
  { question: "What does my scout need for the first campout?", answer: "Standard Scout basics: water bottle, mess kit, weather-appropriate clothing, sleeping bag, and a flashlight. The troop provides tents, cooking gear, and patrol equipment — see the Gear list for what's on hand." },
  { question: "How do advancement and merit badges work?", answer: "Scouts progress through ranks from Scout to Eagle at their own pace. Merit badges are earned with approved counselors. We record each scout's rank and which badges are earned and physically awarded." },
  { question: "Who do I contact with questions?", answer: "Reach out to the troop committee or your patrol leader. Scoutmaster handles program, committee handles registration and finances, and the advancement chair handles badges and ranks." },
];

export const DEFAULT_INVENTORY: { name: string; category: InvCategory; total: number; out: number; min: number }[] = [
  { name: "4-person dome tent", category: "Tents", total: 8, out: 2, min: 2 },
  { name: "2-person backpacking tent", category: "Tents", total: 6, out: 0, min: 1 },
  { name: "Troop flag", category: "Flags", total: 1, out: 0, min: 1 },
  { name: "U.S. flag", category: "Flags", total: 2, out: 0, min: 1 },
  { name: "Patrol flags", category: "Flags", total: 4, out: 1, min: 1 },
  { name: "Camp stove (propane)", category: "Equipment", total: 4, out: 0, min: 1 },
  { name: "Dutch oven", category: "Equipment", total: 3, out: 0, min: 1 },
  { name: "First aid kit", category: "Equipment", total: 5, out: 1, min: 2 },
  { name: "Lantern", category: "Equipment", total: 6, out: 0, min: 2 },
  { name: "Blank merit badge backing", category: "Merit Badges", total: 40, out: 0, min: 10 },
  { name: "First Aid badge (stock)", category: "Merit Badges", total: 6, out: 0, min: 3 },
  { name: "Camping badge (stock)", category: "Merit Badges", total: 5, out: 0, min: 3 },
];

/* ---------- validation schemas (shared by API + clients) ---------- */
export const signupSchema = z.object({
  troopName: z.string().min(2), name: z.string().min(1),
  email: z.string().email(), password: z.string().min(8),
});
export const joinSchema = z.object({
  inviteCode: z.string().min(4), name: z.string().min(1),
  email: z.string().email(), password: z.string().min(8),
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

/** Committee-created scout (walk-in). Parents use intakeSchema via the public link. */
export const scoutCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(SCOUT_TYPES),
  parentName: z.string().optional().default(""),
  contact: z.string().optional().default(""),
  prior: z.string().optional().default(""),
});

/** Public parent intake (no account required). */
export const intakeSchema = z.object({
  scoutName: z.string().min(1),
  type: z.enum(SCOUT_TYPES),
  parentName: z.string().min(1),
  contact: z.string().min(1),
  prior: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

export const transitionSchema = z.object({
  to: z.enum(["submitted", "web_setup", "finance", "active", "declined"]),
  note: z.string().optional().default(""),
});
export const roleSchema = z.object({ role: z.enum(ROLES) });
export const badgeSchema = z.object({
  name: z.string().min(1), earnedDate: z.string().optional(), given: z.boolean().optional().default(false),
});
export const inventorySchema = z.object({
  name: z.string().min(1), category: z.enum(INV_CATEGORIES),
  total: z.number().int().min(0), min: z.number().int().min(0).optional().default(0),
});
export const faqSchema = z.object({ question: z.string().min(1), answer: z.string().default("") });

export type AuthClaims = { userId: string; troopId: string; role: Role };
