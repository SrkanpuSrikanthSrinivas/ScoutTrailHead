import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { C } from "../lib/theme";

type Mode = "login" | "signup" | "join";

export default function Login() {
  const { login, signup, join } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [f, setF] = useState({ troopName: "", inviteCode: "", name: "", email: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const on = (k: string) => (v: string) => setF({ ...f, [k]: v });

  async function submit() {
    setErr(""); setBusy(true);
    try {
      if (mode === "login") await login(f.email, f.password);
      else if (mode === "signup") await signup(f.troopName, f.name, f.email, f.password);
      else await join(f.inviteCode, f.name, f.email, f.password);
      router.replace("/(tabs)");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  const Inp = (p: any) => <TextInput {...p} placeholderTextColor={C.inkSoft}
    style={{ backgroundColor: "#fffdf7", borderWidth: 1.5, borderColor: C.line, borderRadius: 11, padding: 13, fontSize: 16, color: C.ink, marginBottom: 11 }} />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.sand }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 22 }}>
        <View style={{ backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 26 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            <View style={{ width: 26, height: 34, borderRadius: 4, backgroundColor: C.gold }} />
            <View><Text style={{ fontSize: 20, fontWeight: "700", color: C.pine, letterSpacing: 1 }}>TRAILHEAD</Text>
              <Text style={{ fontSize: 11, color: C.gold, fontWeight: "700", letterSpacing: 1 }}>SCOUT MANAGER</Text></View>
          </View>
          <View style={{ flexDirection: "row", backgroundColor: C.sandDeep, borderRadius: 10, padding: 4, marginBottom: 16 }}>
            {(["login", "signup", "join"] as Mode[]).map((m) => (
              <Pressable key={m} onPress={() => { setMode(m); setErr(""); }} style={{ flex: 1, paddingVertical: 9, borderRadius: 7, backgroundColor: mode === m ? "#fff" : "transparent", alignItems: "center" }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: mode === m ? C.pine : C.inkSoft }}>{m === "login" ? "Sign in" : m === "signup" ? "New troop" : "Join"}</Text>
              </Pressable>
            ))}
          </View>
          {mode === "signup" && <Inp placeholder="Troop name (e.g. Troop 100)" value={f.troopName} onChangeText={on("troopName")} />}
          {mode === "join" && <Inp placeholder="Invite code" autoCapitalize="characters" value={f.inviteCode} onChangeText={on("inviteCode")} />}
          {mode !== "login" && <Inp placeholder="Your name" value={f.name} onChangeText={on("name")} />}
          <Inp placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={on("email")} />
          <Inp placeholder="Password" secureTextEntry value={f.password} onChangeText={on("password")} />
          {err ? <Text style={{ color: C.red, fontWeight: "600", marginBottom: 8 }}>{err}</Text> : null}
          <Pressable disabled={busy} onPress={submit} style={{ backgroundColor: C.gold, borderRadius: 11, padding: 14, alignItems: "center", opacity: busy ? 0.6 : 1 }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{busy ? "Working…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create troop" : "Join troop"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
