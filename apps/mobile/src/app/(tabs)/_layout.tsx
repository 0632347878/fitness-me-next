import { Redirect, Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/constants/fitme-theme";

const TabIcon = ({ value, color }: { value: string; color: ColorValue }) => <Text style={{ color, fontSize: 18 }}>{value}</Text>;
export default function TabsLayout() {
  const { user, ready } = useAuth();
  if (ready && !user) return <Redirect href="/(auth)/login"/>;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.sub, tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 72, paddingTop: 8 }, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" } }}><Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color }) => <TabIcon value="⌁" color={color}/> }}/><Tabs.Screen name="workouts" options={{ title: "Workouts", tabBarIcon: ({ color }) => <TabIcon value="✦" color={color}/> }}/><Tabs.Screen name="exercises" options={{ title: "Exercises", tabBarIcon: ({ color }) => <TabIcon value="≡" color={color}/> }}/><Tabs.Screen name="metrics" options={{ title: "Metrics", tabBarIcon: ({ color }) => <TabIcon value="↗" color={color}/> }}/></Tabs>;
}
