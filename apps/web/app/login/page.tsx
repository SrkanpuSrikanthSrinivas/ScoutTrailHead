"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup" | "join";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
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
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><span className="blaze" /><span><b>Trailhead</b><small>Scout Manager</small></span></div>
        <div className="tabs">
          {(["login", "signup", "join"] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? "on" : ""} onClick={() => { setMode(m); setErr(""); }}>
              {m === "login" ? "Sign in" : m === "signup" ? "New troop" : "Join troop"}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {mode === "signup" && (<div><label className="fld">Troop name</label><input value={f.troopName} onChange={set("troopName")} placeholder="Troop 100" /></div>)}
          {mode === "join" && (<div><label className="fld">Invite code</label><input value={f.inviteCode} onChange={set("inviteCode")} placeholder="from your troop admin" /></div>)}
          {mode !== "login" && (<div><label className="fld">Your name</label><input value={f.name} onChange={set("name")} /></div>)}
          <div><label className="fld">Email</label><input type="email" value={f.email} onChange={set("email")} /></div>
          <div><label className="fld">Password</label><input type="password" value={f.password} onChange={set("password")}
            onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
          {err && <div className="err">{err}</div>}
          <button className="btn gold" disabled={busy} onClick={submit}>
            {busy ? "Working…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create troop" : "Join troop"}
          </button>
        </div>
      </div>
    </div>
  );
}
