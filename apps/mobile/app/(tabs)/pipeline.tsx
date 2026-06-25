import { useCallback, useState } from "react";
import { View, Text, Alert, TextInput, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  STATUS_FLOW, STATUS_META, actionsFor, ownsQueue, waitingOn, ROLE_LABEL, RANKS, type ScoutType,
} from "@trailhead/core";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { C } from "../../lib/theme";
import { Screen } from "../../lib/screen";
import { ScreenHeader, Card, Btn, Pill, Field, Sheet, Chips } from "../../lib/ui";

export default function Workflow() {
  const { user } = useAuth();
  const role = user?.role ?? "leader";
  const [scouts, setScouts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try { const all = await api("/scouts"); setScouts(all.filter((s: any) => ["submitted", "web_setup", "finance"].includes(s.status))); } catch {}
    setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const mine = scouts.filter((s) => ownsQueue(s.status, role));
  const rest = scouts.filter((s) => !ownsQueue(s.status, role));

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <ScreenHeader eyebrow="Joining the troop" title="Intake"
        right={<Btn label="+ Walk-in" kind="gold" small onPress={() => setAddOpen(true)} />} />
      {!scouts.length && <Card><Text style={{ textAlign: "center", color: C.inkSoft, padding: 20 }}>🧭{"\n"}No intake in progress. Parents submit via your intake link (share it from Home).</Text></Card>}

      {mine.length > 0 && <Text style={{ fontWeight: "700", color: C.moss, letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>NEEDS YOU — {ROLE_LABEL[role as keyof typeof ROLE_LABEL].toUpperCase()}</Text>}
      {mine.map((s) => <WorkflowCard key={s.id} s={s} role={role} reload={load} onEdit={() => setEdit(s)} highlight />)}

      {rest.length > 0 && <Text style={{ fontWeight: "700", color: C.inkSoft, letterSpacing: 1, marginBottom: 8, marginTop: 14 }}>ELSEWHERE IN THE PIPELINE</Text>}
      {rest.map((s) => <WorkflowCard key={s.id} s={s} role={role} reload={load} onEdit={() => setEdit(s)} />)}

      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); }} />
      <EditSheet scout={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />
    </Screen>
  );
}

function WorkflowCard({ s, role, reload, onEdit, highlight }: any) {
  const [showTl, setShowTl] = useState(false);
  const [note, setNote] = useState("");
  const acts = actionsFor(s.status, role);
  const idx = (STATUS_FLOW as readonly string[]).indexOf(s.status);
  const meta = STATUS_META[s.status as keyof typeof STATUS_META];

  const go = async (to: string, label: string) => {
    try { await api(`/scouts/${s.id}/transition`, { method: "POST", body: JSON.stringify({ to, note }) }); setNote(""); reload(); }
    catch (e: any) { Alert.alert("Can't do that", e.message); }
  };
  const confirmDecline = (to: string, label: string) =>
    Alert.alert("Decline intake", `Decline ${s.name}'s intake?`, [{ text: "Cancel" }, { text: "Decline", style: "destructive", onPress: () => go(to, label) }]);

  return (
    <Card style={highlight ? { borderLeftWidth: 4, borderLeftColor: C.gold } : undefined}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: C.pine }}>{s.name}</Text>
        <Pill text={s.type === "transfer" ? "Transfer" : "New"} kind={s.type as ScoutType} />
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, color: C.inkSoft }}>→ <Text style={{ fontWeight: "700", color: C.pine }}>{waitingOn(s.status)}</Text></Text>
      </View>
      {(s.parentName || s.contact) ? <Text style={{ color: C.inkSoft, fontSize: 12, marginTop: 4 }}>{s.parentName || "—"}{s.contact ? ` · ${s.contact}` : ""}{s.rank ? ` · ${s.rank}` : ""}</Text> : null}

      <View style={{ flexDirection: "row", marginVertical: 12 }}>
        {STATUS_FLOW.map((st, i) => {
          const done = i < idx, cur = i === idx;
          return (
            <View key={st} style={{ flex: 1, alignItems: "center" }}>
              <View style={{ width: 26, height: 32, borderRadius: 5, borderWidth: 2, marginBottom: 5, alignItems: "center", justifyContent: "center", backgroundColor: done ? C.moss : cur ? C.gold : "#fffdf7", borderColor: done ? C.moss : cur ? C.gold : C.line }}>
                <Text style={{ color: done || cur ? "#fff" : C.line, fontWeight: "700", fontSize: 11 }}>{done ? "✓" : i + 1}</Text>
              </View>
              <Text style={{ fontSize: 9.5, fontWeight: "600", textAlign: "center", color: done ? C.moss : cur ? C.goldDeep : C.inkSoft }}>{STATUS_META[st].short}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ backgroundColor: "rgba(74,103,65,.08)", borderLeftWidth: 3, borderLeftColor: C.moss, padding: 10, borderRadius: 8 }}>
        <Text style={{ fontSize: 12.5, color: C.inkSoft }}><Text style={{ fontWeight: "700", color: C.pine }}>{meta.label}: </Text>{meta.desc}</Text>
      </View>

      {acts.length > 0 ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          {acts.some((a) => a.kind !== "forward") && (
            <TextInput value={note} onChangeText={setNote} placeholder="Optional note" placeholderTextColor={C.inkSoft}
              style={{ backgroundColor: "#fffdf7", borderWidth: 1.5, borderColor: C.line, borderRadius: 10, padding: 10, fontSize: 14 }} />
          )}
          {acts.filter((a) => a.kind === "forward").map((a) => <Btn key={a.to} label={a.label} kind="gold" onPress={() => go(a.to, a.label)} />)}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {(role === "web_setup" || role === "admin") && (s.status === "web_setup" || s.status === "submitted") &&
              <Btn label="Edit details" kind="ghost" small onPress={onEdit} />}
            {acts.filter((a) => a.kind === "back").map((a) => <Btn key={a.to} label={a.label} kind="ghost" small onPress={() => go(a.to, a.label)} />)}
            {acts.filter((a) => a.kind === "decline").map((a) => <Btn key={a.to} label="Decline" kind="danger" small onPress={() => confirmDecline(a.to, a.label)} />)}
          </View>
        </View>
      ) : <Text style={{ color: C.inkSoft, fontSize: 12.5, marginTop: 10 }}>Only {waitingOn(s.status)} can move this forward.</Text>}

      <Pressable onPress={() => setShowTl(!showTl)} style={{ marginTop: 12 }}><Text style={{ color: C.moss, fontWeight: "700", fontSize: 12.5 }}>{showTl ? "Hide" : "Show"} history ({s.events?.length || 0})</Text></Pressable>
      {showTl && (
        <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 }}>
          {[...(s.events || [])].reverse().map((e: any) => (
            <View key={e.id} style={{ flexDirection: "row", gap: 8, marginVertical: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.moss, marginTop: 5 }} />
              <Text style={{ flex: 1, fontSize: 12.5, color: C.inkSoft }}><Text style={{ fontWeight: "700", color: C.pine }}>{e.actor}</Text> — {e.action}{e.note ? ` · “${e.note}”` : ""}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function AddSheet({ open, onClose, onSaved }: any) {
  const [name, setName] = useState(""); const [type, setType] = useState<ScoutType>("new");
  const [parentName, setParent] = useState(""); const [contact, setContact] = useState(""); const [prior, setPrior] = useState("");
  return (
    <Sheet visible={open} onClose={onClose} title="Add walk-in scout" subtitle="Enters the workflow at “Submitted”.">
      <Field label="Scout's name" value={name} onChangeText={setName} />
      <Text style={{ fontSize: 11, fontWeight: "700", color: C.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>Joining as</Text>
      <Chips options={["new", "transfer"]} value={type} onChange={(v) => setType(v as ScoutType)} />
      <Field label="Parent / guardian (optional)" value={parentName} onChangeText={setParent} />
      <Field label="Contact (optional)" value={contact} onChangeText={setContact} />
      {type === "transfer" && <Field label="Prior unit (optional)" value={prior} onChangeText={setPrior} />}
      <Btn label="Add to workflow" kind="gold" disabled={!name.trim()}
        onPress={async () => { await api("/scouts", { method: "POST", body: JSON.stringify({ name, type, parentName, contact, prior }) }); setName(""); setParent(""); setContact(""); setPrior(""); onSaved(); }} />
    </Sheet>
  );
}
function EditSheet({ scout, onClose, onSaved }: any) {
  const [rank, setRank] = useState(scout?.rank || "");
  const [contact, setContact] = useState(scout?.contact || "");
  if (!scout) return null;
  return (
    <Sheet visible={!!scout} onClose={onClose} title={`${scout.name} — details`} subtitle="Capture records during web setup. For transfers, set the rank carried over.">
      <Text style={{ fontSize: 11, fontWeight: "700", color: C.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>Rank (carried over)</Text>
      <Chips options={RANKS} value={rank} onChange={setRank} />
      <Field label="Contact" value={contact} onChangeText={setContact} />
      <Btn label="Save details" kind="gold"
        onPress={async () => { await api(`/scouts/${scout.id}`, { method: "PATCH", body: JSON.stringify({ rank, contact }) }); onSaved(); }} />
    </Sheet>
  );
}
