"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RANKS, INV_CATEGORIES, STATUS_FLOW, STATUS_META, ACTIONS, actionsFor, ownsQueue, waitingOn,
  ROLES, ROLE_LABEL, ROLE_BLURB, type ScoutType, type Role, type Status,
} from "@trailhead/core";

type Badge = { id: string; name: string; earnedDate: string | null; given: boolean };
type Event = { id: string; actor: string; action: string; note: string | null; toStatus?: string | null; createdAt: string };
type Scout = { id: string; name: string; type: ScoutType; status: Status; parentName?: string;
  contact?: string; prior?: string; rank?: string; joined?: string | null; badges: Badge[]; events: Event[] };
type Item = { id: string; name: string; category: string; total: number; out: number; min: number };
type Faq = { id: string; question: string; answer: string };
type Member = { id: string; name: string; email: string; role: Role };
type View = "dash" | "pipeline" | "roster" | "inventory" | "faq" | "team";

const api = async (path: string, opts: RequestInit = {}) =>
  fetch("/api" + path, { credentials: "include", headers: { "content-type": "application/json" }, ...opts });
const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function App() {
  const router = useRouter();
  const [me, setMe] = useState<{ user: any; troop: any } | null>(null);
  const [view, setView] = useState<View>("dash");
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [modal, setModal] = useState<React.ReactNode>(null);
  const [ready, setReady] = useState(false);

  const role: Role = me?.user?.role ?? "leader";
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }, []);
  const loadScouts = useCallback(async () => setScouts(await (await api("/scouts")).json()), []);
  const loadItems = useCallback(async () => setItems(await (await api("/inventory")).json()), []);
  const loadFaqs = useCallback(async () => setFaqs(await (await api("/faqs")).json()), []);
  const refreshMe = useCallback(async () => { const r = await api("/me"); if (r.ok) setMe(await r.json()); }, []);

  useEffect(() => {
    (async () => {
      const r = await api("/me");
      if (!r.ok) { router.push("/login"); return; }
      setMe(await r.json());
      await Promise.all([loadScouts(), loadItems(), loadFaqs()]);
      setReady(true);
    })();
  }, [router, loadScouts, loadItems, loadFaqs]);

  // The troop name drives the browser tab title — nothing hard-coded per troop.
  useEffect(() => { if (me?.troop?.name) document.title = `${me.troop.name} — Scout Manager`; }, [me?.troop?.name]);

  if (!ready) return <div style={{ padding: 40 }} className="muted">Loading the troop…</div>;

  const open = scouts.filter((s) => ["submitted", "web_setup", "finance"].includes(s.status));
  const roster = scouts.filter((s) => s.status === "active");
  const myInbox = open.filter((s) => ownsQueue(s.status, role)).length;

  async function logout() { await api("/auth/logout", { method: "POST" }); router.push("/login"); }

  const NAV: [View, string, string, number?][] = [
    ["dash", "⛺", "Dashboard"],
    ["pipeline", "🧭", "Intake Workflow", myInbox || open.length],
    ["roster", "📋", "Roster", roster.length],
    ["inventory", "🎒", "Inventory"],
    ["faq", "❓", "FAQ Sheet"],
    ...(role === "admin" ? [["team", "👥", "Team"] as [View, string, string]] : []),
  ];
  const META: Record<View, [string, string, string]> = {
    dash: ["Overview", "Dashboard", "Where every scout stands and what needs your attention."],
    pipeline: ["Joining the troop", "Intake Workflow", "Parent intake → web setup → finance → roster. Each gate is owned by a role."],
    roster: ["Active scouts", "Roster", "Ranks, merit badges earned, and what's been awarded."],
    inventory: ["Troop gear", "Inventory", "Badge stock, tents, flags & equipment — owned and out."],
    faq: ["For new families", "FAQ Sheet", "The answer sheet you share with anyone asking about joining."],
    team: ["Committee", "Team & Access", "Assign who handles web setup and finance, and share your intake link."],
  };

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand"><span className="blaze" /><span><b>{me?.troop?.name ?? "Trailhead"}</b><small>Scout Manager</small></span></div>
        {NAV.map(([v, ic, label, ct]) => (
          <button key={v} className={"navbtn" + (view === v ? " on" : "")} onClick={() => setView(v)}>
            <span>{ic}</span>{label}{ct ? <span className="ct">{ct}</span> : null}
          </button>
        ))}
        <div className="rail-foot">
          {me?.user?.name} · <b>{ROLE_LABEL[role]}</b><br />
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="stage">
        <div className="topbar">
          <div>
            <div className="eyebrow">{META[view][0]}</div>
            <h1>{META[view][1]}</h1>
            <p>{META[view][2]}</p>
          </div>
          <div className="row">
            {view === "pipeline" && <button className="btn gold" onClick={() => setModal(<AddScout onDone={async () => { setModal(null); await loadScouts(); }} />)}>+ Add walk-in scout</button>}
            {view === "inventory" && <button className="btn gold" onClick={() => setModal(<AddItem onDone={async () => { setModal(null); await loadItems(); }} />)}>+ Add item</button>}
            {view === "faq" && <button className="btn gold" onClick={() => setModal(<EditFaq onDone={async () => { setModal(null); await loadFaqs(); }} />)}>+ Add question</button>}
          </div>
        </div>

        <div className="wrap">
          {view === "dash" && <Dash roster={roster} open={open} items={items} role={role} myInbox={myInbox} onGo={setView} />}
          {view === "pipeline" && <Workflow open={open} approved={roster} role={role} reload={loadScouts} setModal={setModal} notify={notify} setView={setView} />}
          {view === "roster" && <Roster roster={roster} reload={loadScouts} setModal={setModal} setView={setView} />}
          {view === "inventory" && <Inventory items={items} reload={loadItems} />}
          {view === "faq" && <FaqList faqs={faqs} reload={loadFaqs} setModal={setModal} />}
          {view === "team" && <Team troop={me?.troop} onRenamed={refreshMe} />}
        </div>
      </main>

      {modal && <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}><div className="modal">{modal}</div></div>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dash({ roster, open, items, role, myInbox, onGo }: { roster: Scout[]; open: Scout[]; items: Item[]; role: Role; myInbox: number; onGo: (v: View) => void }) {
  const low = items.filter((i) => i.total - i.out <= i.min);
  const awarded = roster.reduce((a, s) => a + s.badges.filter((b) => b.given).length, 0);
  const max = Math.max(1, ...RANKS.map((r) => roster.filter((s) => s.rank === r).length));
  return (
    <>
      {myInbox > 0 && (
        <div className="card needs-you" style={{ background: "rgba(200,146,42,.1)", display: "flex", alignItems: "center", gap: 14 }}>
          <span className="youtag">Needs you</span>
          <span style={{ flex: 1 }}><b>{myInbox}</b> {myInbox === 1 ? "scout is" : "scouts are"} waiting on <b>{ROLE_LABEL[role]}</b>.</span>
          <button className="btn gold sm" onClick={() => onGo("pipeline")}>Open workflow →</button>
        </div>
      )}
      <div className="stat-grid">
        <div className="stat"><div className="n">{roster.length}</div><div className="l">Active scouts</div></div>
        <div className="stat gold"><div className="n">{open.length}</div><div className="l">In intake</div></div>
        <div className="stat"><div className="n">{awarded}</div><div className="l">Badges awarded</div></div>
        <div className={"stat" + (low.length ? " red" : "")}><div className="n">{low.length}</div><div className="l">Low-stock items</div></div>
      </div>
      <div className="card">
        <div className="sectitle">Intake pipeline</div>
        <div className="row" style={{ gap: 10 }}>
          {STATUS_FLOW.slice(0, 3).map((st) => {
            const n = open.filter((s) => s.status === st).length;
            return <div key={st} className="row" style={{ gap: 8 }}><span className={"spill " + st}>{STATUS_META[st].short}</span><b>{n}</b></div>;
          })}
        </div>
      </div>
      <div className="card">
        <div className="sectitle">Rank distribution</div>
        {roster.length ? RANKS.map((r) => {
          const n = roster.filter((s) => s.rank === r).length;
          return <div key={r} className="row" style={{ margin: "7px 0", fontSize: 13.5 }}>
            <span style={{ width: 96, fontWeight: 600 }}>{r}</span>
            <span style={{ flex: 1, height: 10, background: "var(--sand-deep)", borderRadius: 6, overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${n ? Math.max(6, (n / max) * 100) : 0}%`, background: "linear-gradient(90deg,var(--moss),var(--moss-soft))" }} />
            </span><span style={{ width: 22, textAlign: "right", fontWeight: 700, color: "var(--ink-soft)" }}>{n}</span>
          </div>;
        }) : <div className="muted">No scouts on the roster yet.</div>}
      </div>
      {low.length > 0 && (
        <div className="card" style={{ borderColor: "rgba(168,51,31,.35)" }}>
          <div className="sectitle" style={{ color: "var(--red)" }}>Restock soon</div>
          {low.map((i) => <div key={i.id} className="row" style={{ justifyContent: "space-between", margin: "5px 0" }}>
            <span>{i.name} <span className="muted">({i.category})</span></span><span className="avail low">{i.total - i.out} available</span></div>)}
        </div>
      )}
    </>
  );
}

/* ---------------- Workflow ---------------- */
function statusIndex(s: Status) { return (STATUS_FLOW as readonly string[]).indexOf(s); }

/** When did this scout get approved? (newest event flipping to active, else joined date) */
function approvedAt(s: Scout): string {
  const ev = (s.events || []).filter((e) => e.toStatus === "active").map((e) => e.createdAt).sort();
  return ev[ev.length - 1] || s.joined || "";
}

/** The four-gate trail. For an active scout every gate (including Approved) reads done. */
function StatusTrail({ status }: { status: Status }) {
  const idx = status === "active" ? STATUS_FLOW.length : statusIndex(status);
  return (
    <div className="trail" style={{ marginTop: 12 }}>
      {STATUS_FLOW.map((st, i) => (
        <div key={st} className={"step " + (i < idx ? "done" : i === idx ? "current" : "")}>
          <div className="node">{i < idx ? "✓" : i + 1}</div><div className="lbl">{STATUS_META[st].short}</div>
        </div>
      ))}
    </div>
  );
}

function Workflow({ open, approved, role, reload, setModal, notify, setView }: { open: Scout[]; approved: Scout[]; role: Role; reload: () => Promise<void>; setModal: (n: React.ReactNode) => void; notify: (m: string) => void; setView: (v: View) => void }) {
  const mine = open.filter((s) => ownsQueue(s.status, role));
  const rest = open.filter((s) => !ownsQueue(s.status, role));
  const recent = [...approved].sort((a, b) => approvedAt(b).localeCompare(approvedAt(a))).slice(0, 6);
  return (
    <>
      {!open.length && !approved.length && <div className="empty">🧭<br /><strong>No intake in progress.</strong><br /><span className="muted">Parents submit through your intake link (see the Team tab), or add a walk-in above.</span></div>}
      {mine.length > 0 && (<><div className="sectitle">Needs your action ({ROLE_LABEL[role]})</div>{mine.map((s) => <WorkflowCard key={s.id} s={s} role={role} reload={reload} setModal={setModal} notify={notify} highlight />)}</>)}
      {rest.length > 0 && (<><div className="sectitle" style={{ marginTop: mine.length ? 22 : 0 }}>Elsewhere in the pipeline</div>{rest.map((s) => <WorkflowCard key={s.id} s={s} role={role} reload={reload} setModal={setModal} notify={notify} />)}</>)}
      {recent.length > 0 && (
        <>
          <div className="sectitle" style={{ marginTop: open.length ? 24 : 0 }}>Recently approved</div>
          {recent.map((s) => (
            <div key={s.id} className="card" style={{ borderColor: "rgba(74,103,65,.4)" }}>
              <div className="row">
                <span style={{ fontFamily: "Oswald", fontSize: 19, fontWeight: 600, color: "var(--pine)" }}>{s.name}</span>
                <span className="spill active">✓ Approved</span>
                {s.rank ? <span className="rank-badge"><span className="star">★</span>{s.rank}</span> : null}
                <span style={{ flex: 1 }} />
                <button className="btn ghost sm" onClick={() => setView("roster")}>View on roster</button>
              </div>
              <StatusTrail status={s.status} />
              <div className="stepnote" style={{ borderLeftColor: "var(--moss)" }}>Payment confirmed{s.joined ? ` on ${s.joined}` : ""} — now on the active roster.</div>
            </div>
          ))}
          {approved.length > recent.length && <div className="muted" style={{ marginTop: -4 }}>+ {approved.length - recent.length} more on the <a onClick={() => setView("roster")} style={{ cursor: "pointer", textDecoration: "underline" }}>Roster</a>.</div>}
        </>
      )}
    </>
  );
}

function WorkflowCard({ s, role, reload, setModal, notify, highlight }: { s: Scout; role: Role; reload: () => Promise<void>; setModal: (n: React.ReactNode) => void; notify: (m: string) => void; highlight?: boolean }) {
  const [showTl, setShowTl] = useState(false);
  const [note, setNote] = useState("");
  const acts = actionsFor(s.status, role);

  async function go(to: string, label: string) {
    const res = await api(`/scouts/${s.id}/transition`, { method: "POST", body: JSON.stringify({ to, note }) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); alert(j.error || "Couldn't update"); return; }
    setNote("");
    notify(to === "active" ? `🎉 ${s.name} approved — now on the Roster` : to === "declined" ? `${s.name}'s intake declined` : `${s.name}: ${label}`);
    await reload();
  }

  return (
    <div className={"card" + (highlight ? " needs-you" : "")}>
      <div className="row">
        <span style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 600, color: "var(--pine)" }}>{s.name}</span>
        <span className={"pill " + s.type}>{s.type === "transfer" ? "Transfer" : "New scout"}</span>
        {highlight && <span className="youtag">Needs you</span>}
        <span style={{ flex: 1 }} />
        <span className="waiting">Waiting on: <b>{waitingOn(s.status)}</b></span>
      </div>
      {(s.parentName || s.contact) && <div className="muted" style={{ marginTop: 4 }}>Parent: {s.parentName || "—"}{s.contact ? ` · ${s.contact}` : ""}{s.prior ? ` · from ${s.prior}` : ""}{s.rank ? ` · rank ${s.rank}` : ""}</div>}

      <StatusTrail status={s.status} />
      <div className="stepnote"><b>{STATUS_META[s.status].label}:</b> {STATUS_META[s.status].desc}</div>

      {acts.length > 0 ? (
        <>
          {acts.some((a) => a.kind !== "forward") && (
            <input className="note-in" placeholder="Optional note (e.g. why sending back / declining)" value={note} onChange={(e) => setNote(e.target.value)} />
          )}
          <div className="row" style={{ marginTop: 10 }}>
            {acts.filter((a) => a.kind === "forward").map((a) => <button key={a.to} className="btn gold" onClick={() => go(a.to, a.label)}>{a.label}</button>)}
            {(s.status === "web_setup" || role === "admin") && (role === "web_setup" || role === "admin") &&
              <button className="btn ghost sm" onClick={() => setModal(<EditDetails scout={s} onDone={async () => { setModal(null); await reload(); }} />)}>Edit details / rank</button>}
            {acts.filter((a) => a.kind === "back").map((a) => <button key={a.to} className="btn ghost sm" onClick={() => go(a.to, a.label)}>{a.label}</button>)}
            <span style={{ flex: 1 }} />
            {acts.filter((a) => a.kind === "decline").map((a) => <button key={a.to} className="btn danger sm" onClick={() => { if (confirm(`Decline ${s.name}'s intake?`)) go(a.to, a.label); }}>{a.label}</button>)}
          </div>
        </>
      ) : <div className="muted" style={{ marginTop: 8 }}>You can watch this one but only <b>{waitingOn(s.status)}</b> can move it forward.</div>}

      <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => setShowTl(!showTl)}>{showTl ? "Hide" : "Show"} history ({s.events.length})</button>
      {showTl && (
        <div className="timeline">
          {[...s.events].reverse().map((e) => (
            <div key={e.id} className="tl-row"><span className="dot" /><span><span className="who">{e.actor}</span> — {e.action}{e.note ? ` · “${e.note}”` : ""}<br /><span className="when">{fmt(e.createdAt)}</span></span></div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Team ---------------- */
function Team({ troop, onRenamed }: { troop: any; onRenamed: () => Promise<void> }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState("");
  const [tname, setTname] = useState(troop?.name || "");
  const [saving, setSaving] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const intakeLink = `${origin}/intake/${troop?.inviteCode}`;
  const load = useCallback(async () => { const r = await api("/users"); if (r.ok) setMembers(await r.json()); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setTname(troop?.name || ""); }, [troop?.name]);
  const setRole = async (id: string, role: string) => { await api(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }); load(); };
  const copy = (txt: string, what: string) => { navigator.clipboard?.writeText(txt); setCopied(what); setTimeout(() => setCopied(""), 1500); };
  const saveName = async () => {
    const name = tname.trim(); if (name.length < 2) return;
    setSaving("saving");
    const r = await api("/troop", { method: "PATCH", body: JSON.stringify({ name }) });
    if (r.ok) { await onRenamed(); setSaving("saved"); } else { setSaving("err"); }
    setTimeout(() => setSaving(""), 1600);
  };
  return (
    <>
      <div className="card">
        <div className="sectitle">Troop name</div>
        <p className="muted" style={{ marginTop: -4 }}>Shown across the app, in the browser title, and on the parent intake page. Change it to set this up for your own troop.</p>
        <div className="row">
          <input value={tname} onChange={(e) => setTname(e.target.value)} placeholder="e.g. Troop 100, McKinney" style={{ flex: 1, minWidth: 200 }} onKeyDown={(e) => e.key === "Enter" && saveName()} />
          <button className="btn gold" disabled={tname.trim().length < 2 || saving === "saving"} onClick={saveName}>
            {saving === "saved" ? "Saved!" : saving === "saving" ? "Saving…" : "Save name"}
          </button>
        </div>
        {saving === "err" && <div className="err" style={{ marginTop: 8 }}>Couldn’t save — admins only.</div>}
      </div>
      <div className="card">
        <div className="sectitle">Share with parents</div>
        <p className="muted" style={{ marginTop: -4 }}>Anyone with this link can submit a scout — no account needed. New submissions land in the Web Setup queue.</p>
        <div className="linkbox">{intakeLink}<span style={{ flex: 1 }} /><button className="btn sm" onClick={() => copy(intakeLink, "link")}>{copied === "link" ? "Copied!" : "Copy"}</button></div>
      </div>
      <div className="card">
        <div className="sectitle">Invite committee members</div>
        <p className="muted" style={{ marginTop: -4 }}>Share this code; they pick “Join troop” at sign-in. New members start as <b>Leader</b> — set their role below.</p>
        <div className="linkbox">{troop?.inviteCode}<span style={{ flex: 1 }} /><button className="btn sm" onClick={() => copy(troop?.inviteCode, "code")}>{copied === "code" ? "Copied!" : "Copy"}</button></div>
      </div>
      <div className="card">
        <div className="sectitle">Roles</div>
        {members.map((m) => (
          <div key={m.id} className="team-row">
            <div className="who"><b>{m.name}</b><br /><span className="muted">{m.email}</span></div>
            <select value={m.role} onChange={(e) => setRole(m.id, e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        ))}
        <hr className="soft" />
        <div className="role-legend">
          {ROLES.map((r) => <div key={r}><b>{ROLE_LABEL[r]}:</b> {ROLE_BLURB[r]}</div>)}
        </div>
      </div>
    </>
  );
}

/* ---------------- Roster ---------------- */
function Roster({ roster, reload, setModal, setView }: { roster: Scout[]; reload: () => Promise<void>; setModal: (n: React.ReactNode) => void; setView: (v: View) => void }) {
  if (!roster.length) return <div className="empty">📋<br /><strong>The roster is empty.</strong><br /><span className="muted">Scouts arrive here once finance approves them.</span><br /><button className="btn gold" style={{ marginTop: 12 }} onClick={() => setView("pipeline")}>Open the workflow</button></div>;
  const sorted = [...roster].sort((a, b) => RANKS.indexOf(b.rank as any) - RANKS.indexOf(a.rank as any) || a.name.localeCompare(b.name));
  const toggle = async (b: Badge) => { await api(`/badges/${b.id}`, { method: "PATCH", body: JSON.stringify({ given: !b.given }) }); reload(); };
  const del = async (b: Badge) => { await api(`/badges/${b.id}`, { method: "DELETE" }); reload(); };
  return <>{sorted.map((s) => <div key={s.id} className="card">
    <div className="row">
      <span style={{ fontFamily: "Oswald", fontSize: 19, fontWeight: 600, color: "var(--pine)" }}>{s.name}</span>
      <span className="rank-badge"><span className="star">★</span>{s.rank}</span>
      {s.joined && <span className="muted">· since {s.joined}</span>}
      <span style={{ flex: 1 }} />
      <button className="btn ghost sm" onClick={() => setModal(<ChangeRank scout={s} onDone={async () => { setModal(null); await reload(); }} />)}>Change rank</button>
    </div>
    <hr className="soft" />
    <div className="sectitle" style={{ marginBottom: 8 }}>Merit badges <span className="muted" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— gold = physically awarded</span></div>
    <div className="mb-list">
      {s.badges.length ? s.badges.map((b) => <span key={b.id} className={"mb" + (b.given ? " given" : "")}>
        <span className="dot" />{b.name}
        <button className="tg" onClick={() => toggle(b)}>{b.given ? "awarded" : "mark awarded"}</button>
        <button className="x" onClick={() => del(b)}>×</button></span>) : <span className="muted">No merit badges recorded yet.</span>}
    </div>
    <div className="row" style={{ marginTop: 12 }}>
      <button className="btn sm" onClick={() => setModal(<AddBadge scout={s} onDone={async () => { setModal(null); await reload(); }} />)}>+ Record a merit badge</button>
      <button className="btn danger sm" onClick={async () => { if (confirm(`Remove ${s.name}?`)) { await api(`/scouts/${s.id}`, { method: "DELETE" }); reload(); } }}>Remove scout</button>
    </div>
  </div>)}</>;
}

/* ---------------- Inventory ---------------- */
function Inventory({ items, reload }: { items: Item[]; reload: () => Promise<void> }) {
  const adj = async (i: Item, d: number) => { await api(`/inventory/${i.id}`, { method: "PATCH", body: JSON.stringify({ out: i.out + d }) }); reload(); };
  const del = async (i: Item) => { await api(`/inventory/${i.id}`, { method: "DELETE" }); reload(); };
  return <>{INV_CATEGORIES.map((cat) => {
    const list = items.filter((i) => i.category === cat);
    return <div key={cat} className="card">
      <div className="sectitle">{cat === "Merit Badges" ? "🎖️" : cat === "Tents" ? "⛺" : cat === "Flags" ? "🚩" : "🎒"} {cat}</div>
      {list.length ? <table><thead><tr><th>Item</th><th style={{ width: 140 }}>Checked out</th><th style={{ width: 80 }}>Total</th><th style={{ width: 120 }}>Available</th><th /></tr></thead>
        <tbody>{list.map((i) => { const av = i.total - i.out; const low = av <= i.min;
          return <tr key={i.id}><td><b>{i.name}</b>{low && <span className="lowtag">restock</span>}</td>
            <td><span className="qty"><button onClick={() => adj(i, -1)}>−</button><span>{i.out}</span><button onClick={() => adj(i, 1)}>+</button></span></td>
            <td>{i.total}</td><td><span className={"avail" + (low ? " low" : "")}>{av} of {i.total}</span></td>
            <td><button onClick={() => del(i)} style={{ border: 0, background: "none", color: "var(--ink-soft)", fontSize: 18 }}>×</button></td></tr>;
        })}</tbody></table> : <div className="muted">No {cat.toLowerCase()} tracked yet.</div>}
    </div>;
  })}</>;
}

/* ---------------- FAQ ---------------- */
function FaqList({ faqs, reload, setModal }: { faqs: Faq[]; reload: () => Promise<void>; setModal: (n: React.ReactNode) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return <>{faqs.map((f) => <div key={f.id} className="faq-item">
    <div className="q" onClick={() => setOpen(open === f.id ? null : f.id)}>{f.question}</div>
    {open === f.id && <div style={{ marginTop: 8 }}><div className="muted">{f.answer}</div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn ghost sm" onClick={() => setModal(<EditFaq faq={f} onDone={async () => { setModal(null); await reload(); }} />)}>Edit</button>
        <button className="btn danger sm" onClick={async () => { await api(`/faqs/${f.id}`, { method: "DELETE" }); reload(); }}>Delete</button>
      </div></div>}
  </div>)}</>;
}

/* ---------------- Modals ---------------- */
function Field({ label, ...p }: any) { return <div><label className="fld">{label}</label><input {...p} /></div>; }

function AddScout({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState(""); const [type, setType] = useState<ScoutType>("new");
  const [parentName, setParent] = useState(""); const [contact, setContact] = useState(""); const [prior, setPrior] = useState("");
  return <><h3>Add a walk-in scout</h3><div className="sub">For someone who joined in person. They enter the workflow at “Submitted”.</div>
    <div className="fields">
      <Field label="Scout's name" value={name} onChange={(e: any) => setName(e.target.value)} autoFocus />
      <div><label className="fld">Joining as</label><div className="seg">
        <label className={type === "new" ? "on" : ""} onClick={() => setType("new")}>🆕 New scout</label>
        <label className={type === "transfer" ? "on" : ""} onClick={() => setType("transfer")}>🔁 Transfer</label></div></div>
      <Field label="Parent / guardian (optional)" value={parentName} onChange={(e: any) => setParent(e.target.value)} />
      <Field label="Contact (optional)" value={contact} onChange={(e: any) => setContact(e.target.value)} />
      {type === "transfer" && <Field label="Prior unit (optional)" value={prior} onChange={(e: any) => setPrior(e.target.value)} />}
    </div>
    <div className="foot"><button className="btn ghost" onClick={onDone}>Cancel</button>
      <button className="btn gold" disabled={!name.trim()} onClick={async () => { await api("/scouts", { method: "POST", body: JSON.stringify({ name, type, parentName, contact, prior }) }); onDone(); }}>Add to workflow</button></div></>;
}
function EditDetails({ scout, onDone }: { scout: Scout; onDone: () => void }) {
  const [name, setName] = useState(scout.name); const [rank, setRank] = useState(scout.rank || "");
  const [parentName, setParent] = useState(scout.parentName || ""); const [contact, setContact] = useState(scout.contact || ""); const [prior, setPrior] = useState(scout.prior || "");
  return <><h3>{scout.name} — details</h3><div className="sub">Capture records during web setup. For transfers, set the rank carried over from their prior unit.</div>
    <div className="fields">
      <Field label="Scout's name" value={name} onChange={(e: any) => setName(e.target.value)} />
      <div><label className="fld">Rank (carried over / current)</label><select value={rank} onChange={(e) => setRank(e.target.value)}><option value="">— not set —</option>{RANKS.map((r) => <option key={r}>{r}</option>)}</select></div>
      <Field label="Parent / guardian" value={parentName} onChange={(e: any) => setParent(e.target.value)} />
      <Field label="Contact" value={contact} onChange={(e: any) => setContact(e.target.value)} />
      <Field label="Prior unit" value={prior} onChange={(e: any) => setPrior(e.target.value)} />
    </div>
    <div className="foot"><button className="btn ghost" onClick={onDone}>Cancel</button>
      <button className="btn gold" onClick={async () => { await api(`/scouts/${scout.id}`, { method: "PATCH", body: JSON.stringify({ name, rank, parentName, contact, prior }) }); onDone(); }}>Save details</button></div></>;
}
function ChangeRank({ scout, onDone }: { scout: Scout; onDone: () => void }) {
  const [rank, setRank] = useState(scout.rank || RANKS[0]);
  return <><h3>{scout.name} — rank</h3><div className="sub">Update as they advance, Scout → Eagle.</div>
    <div className="fields"><select value={rank} onChange={(e) => setRank(e.target.value)}>{RANKS.map((r) => <option key={r}>{r}</option>)}</select></div>
    <div className="foot"><button className="btn ghost" onClick={onDone}>Cancel</button>
      <button className="btn gold" onClick={async () => { await api(`/scouts/${scout.id}`, { method: "PATCH", body: JSON.stringify({ rank }) }); onDone(); }}>Save rank</button></div></>;
}
function AddBadge({ scout, onDone }: { scout: Scout; onDone: () => void }) {
  const [name, setName] = useState(""); const [earnedDate, setDate] = useState(new Date().toISOString().slice(0, 10)); const [given, setGiven] = useState(false);
  return <><h3>Record a merit badge</h3><div className="sub">For {scout.name}. Mark it awarded when the physical badge is handed over.</div>
    <div className="fields">
      <Field label="Merit badge" value={name} onChange={(e: any) => setName(e.target.value)} autoFocus />
      <Field label="Date earned" type="date" value={earnedDate} onChange={(e: any) => setDate(e.target.value)} />
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}><input type="checkbox" style={{ width: "auto" }} checked={given} onChange={(e) => setGiven(e.target.checked)} /> Physical badge already awarded</label>
    </div>
    <div className="foot"><button className="btn ghost" onClick={onDone}>Cancel</button>
      <button className="btn gold" disabled={!name.trim()} onClick={async () => { await api(`/scouts/${scout.id}/badges`, { method: "POST", body: JSON.stringify({ name, earnedDate, given }) }); onDone(); }}>Add badge</button></div></>;
}
function AddItem({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState(""); const [category, setCat] = useState<string>(INV_CATEGORIES[0]); const [total, setTotal] = useState(1); const [min, setMin] = useState(1);
  return <><h3>Add inventory item</h3><div className="sub">Track anything the troop owns and lends out.</div>
    <div className="fields">
      <Field label="Item name" value={name} onChange={(e: any) => setName(e.target.value)} autoFocus />
      <div><label className="fld">Category</label><select value={category} onChange={(e) => setCat(e.target.value)}>{INV_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div className="row"><div style={{ flex: 1 }}><label className="fld">Total owned</label><input type="number" value={total} onChange={(e) => setTotal(+e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="fld">Restock below</label><input type="number" value={min} onChange={(e) => setMin(+e.target.value)} /></div></div>
    </div>
    <div className="foot"><button className="btn ghost" onClick={onDone}>Cancel</button>
      <button className="btn gold" disabled={!name.trim()} onClick={async () => { await api("/inventory", { method: "POST", body: JSON.stringify({ name, category, total, min }) }); onDone(); }}>Add item</button></div></>;
}
function EditFaq({ faq, onDone }: { faq?: Faq; onDone: () => void }) {
  const [question, setQ] = useState(faq?.question || ""); const [answer, setA] = useState(faq?.answer || "");
  return <><h3>{faq ? "Edit question" : "Add a question"}</h3>
    <div className="fields">
      <Field label="Question" value={question} onChange={(e: any) => setQ(e.target.value)} autoFocus />
      <div><label className="fld">Answer</label><textarea rows={5} value={answer} onChange={(e) => setA(e.target.value)} /></div>
    </div>
    <div className="foot"><button className="btn ghost" onClick={onDone}>Cancel</button>
      <button className="btn gold" disabled={!question.trim()} onClick={async () => {
        if (faq) await api(`/faqs/${faq.id}`, { method: "PATCH", body: JSON.stringify({ question, answer }) });
        else await api("/faqs", { method: "POST", body: JSON.stringify({ question, answer }) });
        onDone();
      }}>Save</button></div></>;
}
