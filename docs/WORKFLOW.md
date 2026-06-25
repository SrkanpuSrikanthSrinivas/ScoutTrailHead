# The intake workflow

A scout joins through a **role-gated approval chain**. Each gate is owned by a role, and
only that role (or an admin) can move a scout forward — so, for example, a scout can't reach
the roster until **Finance** confirms payment.

```
  Parent (public link, no account)
        │  submits intake
        ▼
   ┌──────────┐  Web Setup     ┌──────────┐  Web Setup      ┌──────────┐  Finance       ┌──────────┐
   │ Submitted │ ─────────────▶ │ Web Setup │ ──────────────▶ │ Finance  │ ─────────────▶ │ Approved │ → Roster
   └──────────┘ "Start setup"   └──────────┘ "Send to finance"└──────────┘ "Confirm pay"  └──────────┘
        ▲                              │                            │
        └──── return to queue ─────────┘      ◀── send back ────────┘
   (any open stage can be "Declined")
```

## Roles
| Role | Can do |
|------|--------|
| **Admin** | Everything; manages the team (assigns roles); can act on any gate. |
| **Web Setup** | Picks up submitted intakes, captures records (rank/badges for transfers), sends to finance. |
| **Finance** | Confirms fees/dues are paid, then approves the scout onto the roster. |
| **Leader** | Read-only on the workflow; can still view roster, gear, FAQ. |

New committee members who join with the invite code start as **Leader**. An admin promotes
them to Web Setup or Finance on the **Team** tab.

## How a parent submits (no account)
1. An admin opens **Team → Share with parents** and copies the intake link
   (`/intake/<CODE>`), or turns it into a QR code to print on a flyer.
2. The parent opens it, fills in the scout's name, whether they're new or transferring, and
   a contact. On submit it lands as **Submitted** in the Web Setup queue.
3. No password, no account — the committee takes it from there.

## Inbox / "Needs you"
The Dashboard and the workflow's top section surface exactly the scouts waiting on *your*
role, so each person sees only what they need to act on.

## Audit trail
Every submission, handoff, send-back, decline, and approval is recorded with who did it,
when, and an optional note — visible under **Show history** on each scout's card.

## Where it lives in code
- Rules (gates, who can do what): `packages/core/src/index.ts` — `STATUS_FLOW`, `ACTIONS`,
  `actionsFor`, `ownsQueue`. Change the chain here and both web and mobile update.
- Server enforcement: `apps/web/app/api/scouts/[id]/transition/route.ts` re-checks the role
  on every move (the UI hides buttons, but the server is the real guard).
- Public intake: `apps/web/app/api/public/intake/route.ts` + page `apps/web/app/intake/[code]`.
- Audit rows: `scout_events` table.
