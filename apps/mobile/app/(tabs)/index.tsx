import { useCallback, useState } from "react";
import { View, Text, Share, Pressable } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { RANKS, ROLE_LABEL } from "@trailhead/core";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { C } from "../../lib/theme";
import { Screen } from "../../lib/screen";
import { ScreenHeader, Card, Btn, Sheet, Field } from "../../lib/ui";

export default function Dashboard() {
  const { user, troop, renameTroop } = useAuth();
  const role = user?.role ?? "leader";
  const [d, setD] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [tname, setTname] = useState(troop?.name || "");
  const load = useCallback(async () => { setRefreshing(true); try { setD(await api("/dashboard")); } catch {} setRefreshing(false); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shareIntake = async () => {
    const base = process.env.EXPO_PUBLIC_API_URL ?? "";
    const link = `${base}/intake/${troop?.inviteCode}`;
    try { await Share.share({ message: `Join ${troop?.name}! Submit your scout here: ${link}` }); } catch {}
  };

  const Stat = ({ n, l, color }: any) => (
    <Card style={{ flex: 1, marginHorizontal: 4 }}>
      <Text style={{ fontSize: 32, fontWeight: "700", color: color || C.pine }}>{n ?? "–"}</Text>
      <Text style={{ fontSize: 11, fontWeight: "700", color: C.inkSoft, textTransform: "uppercase", marginTop: 3 }}>{l}</Text>
    </Card>
  );
  const max = Math.max(1, ...RANKS.map((r) => d?.rankCounts?.[r] || 0));

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <ScreenHeader eyebrow="Scout Manager" title={troop?.name || "Home"} subtitle={`Signed in as ${ROLE_LABEL[role as keyof typeof ROLE_LABEL]}`}
        right={role === "admin" ? <Btn label="Rename" kind="ghost" small onPress={() => { setTname(troop?.name || ""); setRenameOpen(true); }} /> : undefined} />

      {d?.myActionCount > 0 && (
        <Pressable onPress={() => router.push("/(tabs)/pipeline")}>
          <Card style={{ backgroundColor: "rgba(200,146,42,.12)", borderColor: C.gold, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2 }}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>NEEDS YOU</Text></View>
            <Text style={{ flex: 1, color: C.ink }}><Text style={{ fontWeight: "700" }}>{d.myActionCount}</Text> waiting on you →</Text>
          </Card>
        </Pressable>
      )}

      <View style={{ flexDirection: "row", marginHorizontal: -4 }}>
        <Stat n={d?.activeCount} l="Active scouts" />
        <Stat n={d?.pipelineCount} l="In intake" color={C.goldDeep} />
      </View>
      <View style={{ flexDirection: "row", marginHorizontal: -4, marginTop: 8 }}>
        <Stat n={d?.badgesAwarded} l="Badges awarded" />
        <Stat n={d?.lowStock?.length} l="Low stock" color={d?.lowStock?.length ? C.red : C.pine} />
      </View>

      <Card style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: "700", color: C.moss, letterSpacing: 1, marginBottom: 10 }}>RANK DISTRIBUTION</Text>
        {d?.activeCount ? RANKS.map((r) => {
          const n = d.rankCounts?.[r] || 0;
          return (
            <View key={r} style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
              <Text style={{ width: 92, fontSize: 12.5, fontWeight: "600" }}>{r}</Text>
              <View style={{ flex: 1, height: 9, backgroundColor: C.sandDeep, borderRadius: 6, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${n ? Math.max(7, (n / max) * 100) : 0}%`, backgroundColor: C.moss }} />
              </View>
              <Text style={{ width: 22, textAlign: "right", fontWeight: "700", color: C.inkSoft }}>{n}</Text>
            </View>
          );
        }) : <Text style={{ color: C.inkSoft }}>No scouts on the roster yet.</Text>}
      </Card>

      {d?.lowStock?.length ? (
        <Card style={{ borderColor: "rgba(168,51,31,.35)" }}>
          <Text style={{ fontWeight: "700", color: C.red, letterSpacing: 1, marginBottom: 8 }}>RESTOCK SOON</Text>
          {d.lowStock.map((i: any) => (
            <View key={i.id} style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 3 }}>
              <Text>{i.name}</Text><Text style={{ color: C.red, fontWeight: "700" }}>{i.available} left</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Btn label="📨  Share parent intake link" kind="gold" onPress={shareIntake} />

      <Sheet visible={renameOpen} onClose={() => setRenameOpen(false)} title="Troop name" subtitle="Shown across the app and on your parent intake link.">
        <Field label="Troop name" value={tname} onChangeText={setTname} />
        <Btn label="Save name" kind="gold" disabled={tname.trim().length < 2}
          onPress={async () => { await renameTroop(tname.trim()); setRenameOpen(false); }} />
      </Sheet>
    </Screen>
  );
}
