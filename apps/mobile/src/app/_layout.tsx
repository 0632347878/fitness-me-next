import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import "react-native-reanimated";
import { AuthProvider } from "@/lib/auth-context";
import { colors } from "@/constants/fitme-theme";

export default function RootLayout() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }));
  return <QueryClientProvider client={client}><AuthProvider><StatusBar style="light"/><Stack screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.bg } }}><Stack.Screen name="index" options={{ headerShown: false }}/><Stack.Screen name="(auth)" options={{ headerShown: false }}/><Stack.Screen name="(tabs)" options={{ headerShown: false }}/><Stack.Screen name="workouts/[id]" options={{ title: "Workout", presentation: "card" }}/></Stack></AuthProvider></QueryClientProvider>;
}
