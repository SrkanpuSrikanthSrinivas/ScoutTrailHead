import { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../lib/api";
import { C } from "../../lib/theme";
import { Screen } from "../../lib/screen";
import { ScreenHeader, Card, Btn, Field, Sheet } from "../../lib/ui";

export default function Faq() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => { setRefreshing(true); try { setFaqs(await api("/faqs")); } catch {} setRefreshing(false); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const del = async (f: any) => { await api(`/faqs/${f.id}`, { method: "DELETE" }); load(); };

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <ScreenHeader eyebrow="For new families" title="FAQ Sheet" subtitle="The answers you share with anyone asking about joining."
        right={<Btn label="+ Add" kind="gold" small onPress={() => setAdding(true)} />} />
      {faqs.map((f) => (
        <Card key={f.id}>
          <Pressable onPress={() => setOpen(open === f.id ? null : f.id)} style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ flex: 1, fontWeight: "700", color: C.pine, fontSize: 14.5 }}>{f.question}</Text>
            <Text style={{ color: C.moss, transform: [{ rotate: open === f.id ? "90deg" : "0deg" }] }}>▶</Text>
          </Pressable>
          {open === f.id && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: C.inkSoft, fontSize: 13.5, lineHeight: 20 }}>{f.answer}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <Btn label="Edit" kind="ghost" small onPress={() => setEdit(f)} />
                <Btn label="Delete" kind="danger" small onPress={() => del(f)} />
              </View>
            </View>
          )}
        </Card>
      ))}
      <FaqSheet faq={edit} open={!!edit || adding} onClose={() => { setEdit(null); setAdding(false); }} onSaved={() => { setEdit(null); setAdding(false); load(); }} />
    </Screen>
  );
}

function FaqSheet({ faq, open, onClose, onSaved }: any) {
  const [question, setQ] = useState(faq?.question || "");
  const [answer, setA] = useState(faq?.answer || "");
  // reset when target changes
  const key = faq?.id || "new";
  return (
    <Sheet visible={open} onClose={onClose} title={faq ? "Edit question" : "Add a question"}>
      <Field key={key + "q"} label="Question" defaultValue={faq?.question} onChangeText={setQ} />
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: C.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>Answer</Text>
        <Field key={key + "a"} label="" defaultValue={faq?.answer} onChangeText={setA} multiline numberOfLines={5} style={{ minHeight: 110, textAlignVertical: "top", backgroundColor: "#fffdf7", borderWidth: 1.5, borderColor: C.line, borderRadius: 11, padding: 12, fontSize: 16 }} />
      </View>
      <Btn label="Save" kind="gold"
        onPress={async () => {
          const q = question || faq?.question || ""; const a = answer || faq?.answer || "";
          if (!q.trim()) return;
          if (faq) await api(`/faqs/${faq.id}`, { method: "PATCH", body: JSON.stringify({ question: q, answer: a }) });
          else await api("/faqs", { method: "POST", body: JSON.stringify({ question: q, answer: a }) });
          onSaved();
        }} />
    </Sheet>
  );
}
