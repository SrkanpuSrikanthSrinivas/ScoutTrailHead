import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../lib/auth";
import { C } from "../lib/theme";

export default function Index() {
  const { ready, user } = useAuth();
  if (!ready) return <View style={{ flex: 1, justifyContent: "center", backgroundColor: C.sand }}><ActivityIndicator color={C.moss} /></View>;
  return <Redirect href={user ? "/(tabs)" : "/login"} />;
}
