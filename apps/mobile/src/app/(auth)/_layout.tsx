import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function AuthLayout() {
  const { user } = useAuth();
  if (user) return <Redirect href="/(tabs)"/>;
  return <Stack screenOptions={{ headerShown: false }}/>;
}
