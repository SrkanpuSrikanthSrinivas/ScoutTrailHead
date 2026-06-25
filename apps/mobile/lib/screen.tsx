import React from "react";
import { ScrollView, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C } from "./theme";

export function Screen({ children, onRefresh, refreshing }: { children: React.ReactNode; onRefresh?: () => void; refreshing?: boolean }) {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.sand }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.moss} /> : undefined}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
