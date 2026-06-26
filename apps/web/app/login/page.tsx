"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const APP = process.env.NEXT_PUBLIC_APP_NAME || "Trailhead";
type StaffMode = "login" | "signup" | "join";
type Audience = "staff" | "parent";

export default function LoginPage() {
  const [audience, setAudience] = useState<Audience>("staff");
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ justifyContent: "center", border: 0, marginBottom: 10, paddingBottom: 0 }}>
          <span className="blaze" /><span><b>{APP}</b><small>Scout Manager</small></span>
        </div>

        <div className="tabs" style={{ marginTop: 6 }}>
          <button className={audience === "parent" ? "on" : ""} onClick={() => setAudience("parent")}>👪 Parent — enroll a scout</button>
          <button className={audience === "staff" ? "on" : ""} onClick={() => setAudience("staff")}>🧭 Troop staff</button>
        </div>

        {audience === "parent" ? <ParentEnroll /> : <StaffAuth />}
      </div>
    </div>
  );
}

/* ---------------- Parent: fill the scout's info, submit (no account) ---------------- */
function ParentEnroll() {
  const [code, setCode] = useState("");
  const [troop, setTroop] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ scoutName: "", type: "new" as "new" | "transfer", parentName: "", contact: "", prior: "", note: "" });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  async function findTroop() {
    setErr(""); setTroop(null);
    const c = code.trim().toUpperCase();
    if (c.length < 4) { setErr("Enter the join code your troop gave you."); return; }
    setChecking(true);
    const r = await fetch(`/api/public/troop?code=${encodeURIComponent(c)}`);
    setChecking(false);
    if (r.ok) setTroop((await r.json()).name); else setErr("That join code isn't recognized — double-check with your troop.");
  }

  async function submit() {
    setErr(""); setBusy(true);
    const r = await fetch(`/api/public/intake?code=${encodeURIComponent(code.trim().toUpperCase())}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f),
    });
    setBusy(false);
    if (r.ok) setDone(true); else { const j = await r.json().catch(() => ({})); setErr(j.error || "Something went wrong"); }
  }

  if (done) return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div style={{ fontSize: 46 }}>🏕️</div>
      <h3 style={{ color: "var(--pine)", textTransform: "uppercase" }}>Submitted — thank you!</h3>
      <p className="muted">{f.scoutName}&rsquo;s details have been sent to {troop || "the troop"}&rsquo;s leaders. A leader will review and start the registration — they&rsquo;ll reach out about next steps and fees. You don&rsquo;t need an account.</p>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 13 }}>
      <p className="muted" style={{ margin: "2px 0 0" }}>Enrolling your scout? Enter your troop&rsquo;s join code, then tell us about your scout. It goes straight to a troop leader — no account needed.</p>

      {!troop ? (
        <>
          <div><label className="fld">Troop join code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. 3F9A2B71" onKeyDown={(e) => e.key === "Enter" && findTroop()} /></div>
          {err && <div className="err">{err}</div>}
          <button className="btn gold" disabled={checking} onClick={findTroop}>{checking ? "Checking…" : "Continue"}</button>
        </>
      ) : (
        <>
          <div style={{ background: "rgba(74,103,65,.1)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontWeight: 600, color: "var(--pine)" }}>
            ✓ {troop} <button onClick={() => { setTroop(null); setCode(""); }} style={{ float: "right", background: "none", border: 0, color: "var(--moss)", textDecoration: "underline", fontWeight: 600 }}>change</button>
          </div>
          <div><label className="fld">Scout&rsquo;s full name</label><input value={f.scoutName} onChange={set("scoutName")} autoFocus /></div>
          <div><label className="fld">Joining as</label><div className="seg">
            <label className={f.type === "new" ? "on" : ""} onClick={() => setF({ ...f, type: "new" })}>🆕 New to Scouting</label>
            <label className={f.type === "transfer" ? "on" : ""} onClick={() => setF({ ...f, type: "transfer" })}>🔁 Transferring in</label></div></div>
          <div><label className="fld">Your name (parent / guardian)</label><input value={f.parentName} onChange={set("parentName")} /></div>
          <div><label className="fld">Best contact (phone or email)</label><input value={f.contact} onChange={set("contact")} /></div>
          {f.type === "transfer" && <div><label className="fld">Prior troop / unit</label><input value={f.prior} onChange={set("prior")} placeholder="e.g. Troop 311" /></div>}
          <div><label className="fld">Anything we should know? (optional)</label><textarea rows={3} value={f.note} onChange={set("note")} /></div>
          {err && <div className="err">{err}</div>}
          <button className="btn gold" disabled={busy || !f.scoutName.trim() || !f.parentName.trim() || !f.contact.trim()} onClick={submit}>
            {busy ? "Sending…" : "Submit to the troop"}</button>
        </>
      )}
    </div>
  );
}

/* ---------------- Staff: sign in / create troop / committee sign-up ---------------- */
function StaffAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<StaffMode>("login");
  const [f, setF] = useState({ troopName: "", inviteCode: "", name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setErr(""); setBusy(true);
    const url = mode === "login" ? "/api/auth/login" : mode === "signup" ? "/api/auth/signup" : "/api/auth/join";
    const body =
      mode === "login" ? { email: f.email, password: f.password }
      : mode === "signup" ? { troopName: f.troopName, name: f.name, email: f.email, password: f.password }
      : { inviteCode: f.inviteCode, name: f.name, email: f.email, password: f.password };
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setErr(j.error || "Something went wrong"); return; }
    router.push("/"); router.refresh();
  }

  return (
    <>
      <div className="tabs" style={{ marginTop: 14 }}>
        <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErr(""); }}>Sign in</button>
        <button className={mode === "signup" ? "on" : ""} onClick={() => { setMode("signup"); setErr(""); }}>Create troop</button>
        <button className={mode === "join" ? "on" : ""} onClick={() => { setMode("join"); setErr(""); }}>Committee</button>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {mode === "signup" && (<div><label className="fld">Troop name</label><input value={f.troopName} onChange={set("troopName")} placeholder="Troop 100" /></div>)}
        {mode === "join" && (<><p className="muted" style={{ margin: 0 }}>For committee/leaders joining an existing troop. You&rsquo;ll start as a Leader; an admin can adjust your role.</p>
          <div><label className="fld">Invite code</label><input value={f.inviteCode} onChange={set("inviteCode")} placeholder="from your troop admin" /></div></>)}
        {mode !== "login" && (<div><label className="fld">Your name</label><input value={f.name} onChange={set("name")} /></div>)}
        <div><label className="fld">Email</label><input type="email" value={f.email} onChange={set("email")} /></div>
        <div><label className="fld">Password</label><input type="password" value={f.password} onChange={set("password")} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
        {err && <div className="err">{err}</div>}
        <button className="btn gold" disabled={busy} onClick={submit}>
          {busy ? "Working…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create troop" : "Join as committee"}</button>
      </div>
    </>
  );
}
