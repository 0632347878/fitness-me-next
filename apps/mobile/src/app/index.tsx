import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/constants/fitme-theme";

export default function Index() {
  const { user, ready } = useAuth();
  if (!ready) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}><ActivityIndicator color={colors.accent}/></View>;
  return <Redirect href={user ? "/(tabs)" : "/(auth)/login"}/>;
}
