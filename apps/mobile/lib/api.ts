import * as SecureStore from "expo-secure-store";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "trailhead_token";

export async function getToken() { return SecureStore.getItemAsync(TOKEN_KEY); }
export async function setToken(t: string) { await SecureStore.setItemAsync(TOKEN_KEY, t); }
export async function clearToken() { await SecureStore.deleteItemAsync(TOKEN_KEY); }

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body as T;
}
