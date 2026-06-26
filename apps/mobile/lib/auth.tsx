import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, clearToken, getToken } from "./api";

type User = { id: string; name: string; email: string; role: string };
type Troop = { id: string; name: string; inviteCode?: string };
type Ctx = {
  ready: boolean; user: User | null; troop: Troop | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (troopName: string, name: string, email: string, password: string) => Promise<void>;
  join: (inviteCode: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  renameTroop: (name: string) => Promise<void>;
};
const AuthContext = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [troop, setTroop] = useState<Troop | null>(null);

  useEffect(() => {
    (async () => {
      if (await getToken()) {
        try { const me = await api("/me"); setUser(me.user); setTroop(me.troop); } catch { await clearToken(); }
      }
      setReady(true);
    })();
  }, []);

  const finish = (r: any) => { setToken(r.token); setUser(r.user); setTroop(r.troop); };

  const value: Ctx = {
    ready, user, troop,
    login: async (email, password) => finish(await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })),
    signup: async (troopName, name, email, password) => finish(await api("/auth/signup", { method: "POST", body: JSON.stringify({ troopName, name, email, password }) })),
    join: async (inviteCode, name, email, password) => finish(await api("/auth/join", { method: "POST", body: JSON.stringify({ inviteCode, name, email, password }) })),
    logout: async () => { await clearToken(); setUser(null); setTroop(null); },
    renameTroop: async (name: string) => {
      const r = await api("/troop", { method: "PATCH", body: JSON.stringify({ name }) });
      setTroop((t) => (t ? { ...t, name: r.name } : t));
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
