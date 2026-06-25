import { Tabs } from "expo-router";
import { Text } from "react-native";
import { C } from "../../lib/theme";

const icon = (e: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 20, opacity: color === C.moss ? 1 : 0.55 }}>{e}</Text>;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.moss,
      tabBarInactiveTintColor: C.inkSoft,
      tabBarStyle: { backgroundColor: C.paper, borderTopColor: C.line },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
    }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("⛺") }} />
      <Tabs.Screen name="pipeline" options={{ title: "Joining", tabBarIcon: icon("🧭") }} />
      <Tabs.Screen name="roster" options={{ title: "Roster", tabBarIcon: icon("📋") }} />
      <Tabs.Screen name="gear" options={{ title: "Gear", tabBarIcon: icon("🎒") }} />
      <Tabs.Screen name="faq" options={{ title: "FAQ", tabBarIcon: icon("❓") }} />
    </Tabs>
  );
}
