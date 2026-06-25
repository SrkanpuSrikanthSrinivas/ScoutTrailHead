import { useCallback, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { RANKS } from "@trailhead/core";
import { api } from "../../lib/api";
import { C } from "../../lib/theme";
import { Screen } from "../../lib/screen";
import { ScreenHeader, Card, Btn, Pill, Field, Sheet, Chips } from "../../lib/ui";

export default function Roster() {
  const [roster, setRoster] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [rankFor, setRankFor] = useState<any>(null);
  const [badgeFor, setBadgeFor] = useState<any>(null);

  const load = useCallback(async () => { setRefreshing(true); try { const all = await api("/scouts"); setRoster(all.filter((s: any) => s.status === "active")); } catch {} setRefreshing(false); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (b: any) => { await api(`/badges/${b.id}`, { method: "PATCH", body: JSON.stringify({ given: !b.given }) }); load(); };
  const delBadge = async (b: any) => { await api(`/badges/${b.id}`, { method: "DELETE" }); load(); };
  const remove = (s: any) => Alert.alert("Remove scout", `Remove ${s.name}?`, [{ text: "Keep" }, { text: "Remove", style: "destructive", onPress: async () => { await api(`/scouts/${s.id}`, { method: "DELETE" }); load(); } }]);

  const sorted = [...roster].sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank) || a.name.localeCompare(b.name));

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <ScreenHeader eyebrow="Active scouts" title="Roster" subtitle="Ranks, merit badges earned, and what's been awarded." />
      {!sorted.length && <Card><Text style={{ textAlign: "center", color: C.inkSoft, padding: 20 }}>📋{"\n"}The roster is empty. Scouts arrive here once they finish Joining.</Text></Card>}
      {sorted.map((s) => (
        <Card key={s.id}>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.pine }}>{s.name}</Text>
            <View style={{ backgroundColor: C.pine, borderRadius: 30, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>★ {s.rank}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Btn label="Rank" kind="ghost" small onPress={() => setRankFor(s)} />
          </View>
          {s.joined ? <Text style={{ color: C.inkSoft, fontSize: 12, marginTop: 4 }}>since {s.joined} · {s.type === "transfer" ? "transferred in" : "joined new"}</Text> : null}
          <View style={{ height: 1, backgroundColor: C.line, marginVertical: 12 }} />
          <Text style={{ fontWeight: "700", color: C.moss, letterSpacing: 1, marginBottom: 8, fontSize: 12 }}>MERIT BADGES</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {s.badges?.length ? s.badges.map((b: any) => (
              <View key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: b.given ? "rgba(200,146,42,.16)" : "#fffdf7", borderWidth: 1.5, borderColor: b.given ? C.gold : C.line, borderRadius: 30, paddingLeft: 11, paddingRight: 7, paddingVertical: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.given ? C.gold : C.line }} />
                <Text style={{ fontSize: 12.5, fontWeight: "600" }}>{b.name}</Text>
                <Pressable onPress={() => toggle(b)}><Text style={{ color: C.moss, fontWeight: "700", fontSize: 11, textDecorationLine: "underline" }}>{b.given ? "awarded" : "award"}</Text></Pressable>
                <Pressable onPress={() => delBadge(b)}><Text style={{ color: C.inkSoft, fontWeight: "700", fontSize: 16 }}>×</Text></Pressable>
              </View>
            )) : <Text style={{ color: C.inkSoft }}>None recorded yet.</Text>}
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={{ flex: 1 }}><Btn label="+ Record badge" small onPress={() => setBadgeFor(s)} /></View>
            <Btn label="Remove" kind="danger" small onPress={() => remove(s)} />
          </View>
        </Card>
      ))}

      <RankSheet scout={rankFor} onClose={() => setRankFor(null)} onSaved={() => { setRankFor(null); load(); }} />
      <BadgeSheet scout={badgeFor} onClose={() => setBadgeFor(null)} onSaved={() => { setBadgeFor(null); load(); }} />
    </Screen>
  );
}

function RankSheet({ scout, onClose, onSaved }: any) {
  const [rank, setRank] = useState(scout?.rank || RANKS[0]);
  if (!scout) return null;
  return (
    <Sheet visible={!!scout} onClose={onClose} title={`${scout.name} — rank`} subtitle="Update as they advance, Scout → Eagle.">
      <Chips options={RANKS} value={rank} onChange={setRank} />
      <Btn label="Save rank" kind="gold" onPress={async () => { await api(`/scouts/${scout.id}`, { method: "PATCH", body: JSON.stringify({ rank }) }); onSaved(); }} />
    </Sheet>
  );
}
function BadgeSheet({ scout, onClose, onSaved }: any) {
  const [name, setName] = useState(""); const [given, setGiven] = useState(false);
  if (!scout) return null;
  return (
    <Sheet visible={!!scout} onClose={onClose} title="Record a merit badge" subtitle={`For ${scout.name}. Mark awarded when the badge is handed over.`}>
      <Field label="Merit badge" value={name} onChangeText={setName} />
      <Pressable onPress={() => setGiven(!given)} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <View style={{ width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: given ? C.gold : C.line, backgroundColor: given ? C.gold : "transparent", alignItems: "center", justifyContent: "center" }}>
          {given ? <Text style={{ color: "#fff", fontWeight: "700" }}>✓</Text> : null}
        </View>
        <Text style={{ fontWeight: "600", color: C.ink }}>Physical badge already awarded</Text>
      </Pressable>
      <Btn label="Add badge" kind="gold" disabled={!name.trim()}
        onPress={async () => { await api(`/scouts/${scout.id}/badges`, { method: "POST", body: JSON.stringify({ name, given }) }); setName(""); setGiven(false); onSaved(); }} />
    </Sheet>
  );
}
