# The intake workflow

A scout joins through a **role-gated approval chain**. A parent submits the scout's details
(no account); it lands with the troop's **leaders**, who start and run the workflow; the last
gate is **Finance**, who confirms payment and approves to the roster.

```
  Parent (enrolls via join code — no account)
        │  submits the scout's info
        ▼
   ┌──────────┐  Leader        ┌──────────┐  Leader          ┌──────────┐  Finance        ┌──────────┐
   │ Submitted │ ─────────────▶ │ Web Setup │ ───────────────▶ │ Finance  │ ──────────────▶ │ Approved │ → Roster
   └──────────┘ "Review &       └──────────┘ "Send to finance"└──────────┘ "Confirm pay"   └──────────┘
        ▲         start setup"          │                            │
        └──── return to queue ──────────┘      ◀── send back ────────┘
   (any open stage can be "Declined")
```

## Two separate doors (this is the important bit)
- **Parents** do **not** make accounts. On the sign-in screen they pick **“Parent — enroll a
  scout,”** enter the troop's join code, fill in the **scout's** information, and submit. (They
  can also use the direct link `/intake/<CODE>`.) The submission becomes a **Submitted** intake.
- **Troop staff** (leaders, finance, admins) use **“Troop staff”** to sign in, create a troop,
  or join an existing troop as committee. Staff accounts are what move scouts through the gates.

## Roles
| Role | Can do |
|------|--------|
| **Admin** | Everything; manages the team (assigns roles); can act on any gate. |
| **Leader** | Receives new parent submissions, **starts** the workflow, prepares records, and sends to finance. This is the default role for committee members. |
| **Web Setup** | Optional specialist for the setup stage — same powers as a leader on Submitted/Web Setup, for troops that want a dedicated person. |
| **Finance** | Confirms fees/dues are paid, then approves the scout onto the roster. |

New committee members who join with the invite code start as **Leader**, so by default they
can pick up and run intakes immediately. An admin can promote someone to Finance (or the
optional Web Setup specialist) on the **Team** tab.

## Inbox / "Needs you"
The Dashboard and the workflow's top section surface exactly the scouts whose current gate
*your* role can move forward — so a leader sees new submissions to start, finance sees scouts
awaiting payment confirmation.

## Audit trail
Every submission, handoff, send-back, decline, and approval is recorded with who did it,
when, and an optional note — visible under **Show history** on each scout's card.

## Where it lives in code
- Rules (gates, who can do what): `packages/core/src/index.ts` — `STATUS_FLOW`, `ACTIONS`,
  `actionsFor`, `ownsQueue`. Leaders are included on the Submitted and Web Setup transitions.
- Server enforcement: `apps/web/app/api/scouts/[id]/transition/route.ts` re-checks the role on
  every move (the UI hides buttons, but the server is the real guard).
- Parent enrollment: the **Parent** tab on `apps/web/app/login/page.tsx`, plus the public page
  `apps/web/app/intake/[code]`, both posting to `/api/public/intake`.
