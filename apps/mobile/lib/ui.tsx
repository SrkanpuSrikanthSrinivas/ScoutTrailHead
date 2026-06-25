import React from "react";
import { View, Text, Pressable, TextInput, Modal, ScrollView } from "react-native";
import { C } from "./theme";

export function ScreenHeader({ eyebrow, title, subtitle, right }: { eyebrow: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={{ paddingBottom: 12, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10.5, letterSpacing: 1.6, color: C.moss, fontWeight: "700" }}>{eyebrow.toUpperCase()}</Text>
        <Text style={{ fontSize: 25, fontWeight: "700", color: C.pine, letterSpacing: 0.5 }}>{title}</Text>
        {subtitle ? <Text style={{ color: C.inkSoft, fontSize: 13, marginTop: 3 }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export const Card = ({ children, style }: any) => (
  <View style={[{ backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 15, marginBottom: 12 }, style]}>{children}</View>
);

export const Btn = ({ label, onPress, kind = "moss", disabled, small }: { label: string; onPress: () => void; kind?: "moss" | "gold" | "ghost" | "danger"; disabled?: boolean; small?: boolean }) => {
  const bg = kind === "gold" ? C.gold : kind === "moss" ? C.moss : "transparent";
  const fg = kind === "ghost" ? C.moss : kind === "danger" ? C.red : "#fff";
  const border = kind === "ghost" ? C.line : kind === "danger" ? "rgba(168,51,31,.4)" : "transparent";
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ backgroundColor: bg, borderColor: border, borderWidth: 1.5, borderRadius: 11, paddingVertical: small ? 9 : 13, paddingHorizontal: small ? 13 : 16, alignItems: "center", opacity: disabled ? 0.5 : 1 }}>
      <Text style={{ color: fg, fontWeight: "700", fontSize: small ? 13 : 14.5 }}>{label}</Text>
    </Pressable>
  );
};

export const Pill = ({ text, kind }: { text: string; kind: "new" | "transfer" }) => (
  <View style={{ backgroundColor: kind === "new" ? "rgba(74,103,65,.15)" : "rgba(200,146,42,.2)", borderRadius: 30, paddingHorizontal: 9, paddingVertical: 3 }}>
    <Text style={{ fontSize: 11, fontWeight: "700", color: kind === "new" ? C.moss : C.goldDeep }}>{text}</Text>
  </View>
);

export function Field({ label, ...p }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", color: C.inkSoft, marginBottom: 6 }}>{label}</Text>
      <TextInput {...p} placeholderTextColor={C.inkSoft}
        style={{ backgroundColor: "#fffdf7", borderWidth: 1.5, borderColor: C.line, borderRadius: 11, padding: 12, fontSize: 16, color: C.ink }} />
    </View>
  );
}

export function Sheet({ visible, onClose, title, subtitle, children }: { visible: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(38,34,28,.5)", justifyContent: "flex-end" }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: C.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 34 }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: C.line, alignSelf: "center", marginBottom: 14 }} />
          <Text style={{ fontSize: 21, fontWeight: "700", color: C.pine }}>{title}</Text>
          {subtitle ? <Text style={{ color: C.inkSoft, fontSize: 13, marginBottom: 14, marginTop: 2 }}>{subtitle}</Text> : <View style={{ height: 12 }} />}
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function Chips({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={{ borderWidth: 1.5, borderColor: value === o ? C.moss : C.line, backgroundColor: value === o ? "rgba(74,103,65,.12)" : "#fffdf7", borderRadius: 30, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8 }}>
          <Text style={{ fontWeight: "700", fontSize: 13, color: value === o ? C.moss : C.inkSoft }}>{o}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export const Trail = ({ steps, current }: { steps: { t: string }[]; current: number }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
    {steps.map((st, i) => {
      const done = i < current, cur = i === current;
      return (
        <View key={i} style={{ width: 74, alignItems: "center" }}>
          <View style={{ width: 28, height: 34, borderRadius: 5, borderWidth: 2, marginBottom: 6, alignItems: "center", justifyContent: "center",
            backgroundColor: done ? C.moss : cur ? C.gold : "#fffdf7", borderColor: done ? C.moss : cur ? C.gold : C.line }}>
            <Text style={{ color: done || cur ? "#fff" : C.line, fontWeight: "700", fontSize: 12 }}>{done ? "✓" : i + 1}</Text>
          </View>
          <Text style={{ fontSize: 10.5, fontWeight: "600", textAlign: "center", color: done ? C.moss : cur ? C.goldDeep : C.inkSoft }}>{st.t}</Text>
        </View>
      );
    })}
  </ScrollView>
);
