import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, Screen, Title } from "@/components/ui";
import { colors } from "@/constants/fitme-theme";
import { fitnessApi } from "@/lib/fitness-api";
import { useAuth } from "@/lib/auth-context";

export default function Dashboard() {
  const { user, logout } = useAuth(); const query = useQuery({ queryKey: ["dashboard"], queryFn: fitnessApi.dashboard }); const d = query.data;
  return <Screen><ScrollView refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.accent}/>} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}><Title sub={`Welcome back, ${user?.name ?? user?.email ?? "athlete"}`}>Today</Title>{query.error ? <Text style={s.error}>{query.error.message}</Text> : null}<View style={s.grid}><Stat label="This week" value={d?.workoutsThisWeek ?? "—"}/><Stat label="Streak" value={d ? `${d.streak}d` : "—"}/><Stat label="Total sets" value={d?.totalSets ?? "—"}/><Stat label="Weight" value={d?.currentWeight ? `${d.currentWeight} kg` : "—"}/></View><Text style={s.section}>Recent workouts</Text>{d?.recentWorkouts?.slice(0, 4).map((w) => <Card key={w.id}><Text style={s.cardTitle}>{new Date(w.startedAt).toLocaleDateString()}</Text><Text style={s.meta}>{w.sets.length} sets · {new Set(w.sets.map((x) => x.exercise.id)).size} exercises</Text></Card>)}{!query.isLoading && !d?.recentWorkouts?.length ? <Card><Text style={s.meta}>Your completed workouts will appear here.</Text></Card> : null}<Button title="Log out" variant="ghost" onPress={logout}/></ScrollView></Screen>;
}
function Stat({ label, value }: { label: string; value: string | number }) { return <View style={s.stat}><Text style={s.value}>{value}</Text><Text style={s.label}>{label}</Text></View>; }
const s = StyleSheet.create({ grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, stat: { width: "48%", minHeight: 105, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 15, justifyContent: "flex-end" }, value: { color: colors.text, fontSize: 26, fontWeight: "900" }, label: { color: colors.sub, textTransform: "uppercase", fontWeight: "700", fontSize: 10 }, section: { color: colors.text, fontWeight: "900", textTransform: "uppercase", marginTop: 10 }, cardTitle: { color: colors.text, fontWeight: "800" }, meta: { color: colors.sub }, error: { color: colors.danger } });
