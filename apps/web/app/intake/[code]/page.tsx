"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ScoutType = "new" | "transfer";

export default function IntakePage() {
  const { code } = useParams<{ code: string }>();
  const [troop, setTroop] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ scoutName: "", type: "new" as ScoutType, parentName: "", contact: "", prior: "", note: "" });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/public/troop?code=${encodeURIComponent(code)}`);
      if (r.ok) setTroop((await r.json()).name); else setBad(true);
    })();
  }, [code]);

  async function submit() {
    setErr(""); setBusy(true);
    const r = await fetch(`/api/public/intake?code=${encodeURIComponent(code)}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f),
    });
    setBusy(false);
    if (r.ok) setDone(true); else { const j = await r.json().catch(() => ({})); setErr(j.error || "Something went wrong"); }
  }

  if (bad) return <Shell><h2>Link not recognized</h2><p className="muted">Double-check the intake link your troop shared with you.</p></Shell>;
  if (done) return <Shell><div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>🏕️</div>
    <h2>Thanks, {f.parentName.split(" ")[0] || "and welcome"}!</h2>
    <p className="muted">{f.scoutName}&rsquo;s information has been sent to {troop || "the troop"}&rsquo;s committee. They&rsquo;ll get records set up and reach out about registration and fees. No account needed on your end.</p></div></Shell>;

  return (
    <Shell>
      <div className="eyebrow">Join {troop || "the troop"}</div>
      <h2>Scout intake</h2>
      <p className="muted" style={{ marginTop: -2 }}>Tell us about your scout. The committee handles setup and will follow up about fees — you don&rsquo;t need to create an account.</p>
      <div style={{ display: "grid", gap: 13, marginTop: 18 }}>
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
          {busy ? "Sending…" : "Submit intake"}</button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ justifyContent: "center", border: 0, marginBottom: 10, paddingBottom: 0 }}>
          <span className="blaze" /><span><b>{process.env.NEXT_PUBLIC_APP_NAME || "Trailhead"}</b><small>Scout Manager</small></span>
        </div>
        {children}
      </div>
    </div>
  );
}
