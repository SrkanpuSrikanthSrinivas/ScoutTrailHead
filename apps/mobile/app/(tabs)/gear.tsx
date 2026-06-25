import { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { INV_CATEGORIES } from "@trailhead/core";
import { api } from "../../lib/api";
import { C } from "../../lib/theme";
import { Screen } from "../../lib/screen";
import { ScreenHeader, Card, Btn, Field, Sheet, Chips } from "../../lib/ui";

const ICON: Record<string, string> = { "Merit Badges": "🎖️", Tents: "⛺", Flags: "🚩", Equipment: "🎒" };

export default function Gear() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => { setRefreshing(true); try { setItems(await api("/inventory")); } catch {} setRefreshing(false); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const adj = async (i: any, d: number) => { await api(`/inventory/${i.id}`, { method: "PATCH", body: JSON.stringify({ out: i.out + d }) }); load(); };
  const del = async (i: any) => { await api(`/inventory/${i.id}`, { method: "DELETE" }); load(); };

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <ScreenHeader eyebrow="Troop gear" title="Gear" subtitle="Badge stock, tents, flags & equipment — owned and out."
        right={<Btn label="+ Add" kind="gold" small onPress={() => setAddOpen(true)} />} />
      {INV_CATEGORIES.map((cat) => {
        const list = items.filter((i) => i.category === cat);
        return (
          <Card key={cat}>
            <Text style={{ fontWeight: "700", color: C.moss, letterSpacing: 1, marginBottom: 10 }}>{ICON[cat]} {cat.toUpperCase()}</Text>
            {list.length ? list.map((i) => {
              const av = i.total - i.out, low = av <= i.min;
              return (
                <View key={i.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", fontSize: 14 }}>{i.name}{low ? <Text style={{ color: C.red, fontSize: 10, fontWeight: "700" }}>  RESTOCK</Text> : null}</Text>
                    <Text style={{ fontSize: 11.5, color: low ? C.red : C.inkSoft, fontWeight: "600", marginTop: 2 }}>{av} of {i.total} available · {i.out} out</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                    <Pressable onPress={() => adj(i, -1)} style={btn}><Text style={btnT}>−</Text></Pressable>
                    <Text style={{ minWidth: 20, textAlign: "center", fontWeight: "700" }}>{i.out}</Text>
                    <Pressable onPress={() => adj(i, 1)} style={btn}><Text style={btnT}>+</Text></Pressable>
                    <Pressable onPress={() => del(i)}><Text style={{ color: C.inkSoft, fontSize: 18, marginLeft: 4 }}>×</Text></Pressable>
                  </View>
                </View>
              );
            }) : <Text style={{ color: C.inkSoft }}>No {cat.toLowerCase()} tracked yet.</Text>}
          </Card>
        );
      })}
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); }} />
    </Screen>
  );
}
const btn = { width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: C.line, backgroundColor: "#fffdf7", alignItems: "center", justifyContent: "center" } as const;
const btnT = { fontSize: 19, fontWeight: "700", color: C.moss } as const;

function AddSheet({ open, onClose, onSaved }: any) {
  const [name, setName] = useState(""); const [category, setCat] = useState<string>(INV_CATEGORIES[0]);
  const [total, setTotal] = useState("1"); const [min, setMin] = useState("1");
  return (
    <Sheet visible={open} onClose={onClose} title="Add gear item" subtitle="Track anything the troop owns and lends out.">
      <Field label="Item name" value={name} onChangeText={setName} />
      <Text style={{ fontSize: 11, fontWeight: "700", color: C.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>Category</Text>
      <Chips options={INV_CATEGORIES} value={category} onChange={setCat} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Total owned" value={total} onChangeText={setTotal} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Field label="Restock below" value={min} onChangeText={setMin} keyboardType="number-pad" /></View>
      </View>
      <Btn label="Add item" kind="gold" disabled={!name.trim()}
        onPress={async () => { await api("/inventory", { method: "POST", body: JSON.stringify({ name, category, total: +total || 0, min: +min || 0 }) }); setName(""); onSaved(); }} />
    </Sheet>
  );
}
