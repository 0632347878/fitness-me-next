import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, Field, Screen, Title } from "@/components/ui";
import { colors } from "@/constants/fitme-theme";
import { fitnessApi } from "@/lib/fitness-api";

export default function Metrics() {
  const qc = useQueryClient(); const query = useQuery({ queryKey: ["metrics"], queryFn: fitnessApi.metrics }); const [weight, setWeight] = useState(""); const [bodyFat, setBodyFat] = useState(""); const mutation = useMutation({ mutationFn: fitnessApi.logMetric, onSuccess: () => { setWeight(""); setBodyFat(""); qc.invalidateQueries({ queryKey: ["metrics"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); } });
  function submit() { const w = Number(weight); const bf = Number(bodyFat); if (!w && !bf) return; mutation.mutate({ date: new Date().toISOString().slice(0, 10), weight: w || undefined, bodyFat: bf || undefined }); }
  const metrics = [...(query.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  return <Screen><ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 20 }}><Title sub="Small changes become visible">Metrics</Title><Card><View style={s.row}><View style={{ flex: 1 }}><Field label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad"/></View><View style={{ flex: 1 }}><Field label="Body fat (%)" value={bodyFat} onChangeText={setBodyFat} keyboardType="decimal-pad"/></View></View>{mutation.error ? <Text style={s.error}>{mutation.error.message}</Text> : null}<Button title="Save measurement" busy={mutation.isPending} onPress={submit}/></Card><Text style={s.section}>History</Text>{metrics.map((m) => <Card key={m.id}><View style={s.line}><Text style={s.date}>{new Date(m.date).toLocaleDateString()}</Text><Text style={s.value}>{m.weight ? `${m.weight} kg` : "—"}</Text><Text style={s.fat}>{m.bodyFat ? `${m.bodyFat}% fat` : ""}</Text></View></Card>)}</ScrollView></Screen>;
}
const s = StyleSheet.create({ row: { flexDirection: "row", gap: 10 }, section: { color: colors.text, fontWeight: "900", textTransform: "uppercase" }, line: { flexDirection: "row", alignItems: "center", gap: 12 }, date: { color: colors.sub, flex: 1 }, value: { color: colors.text, fontSize: 18, fontWeight: "900" }, fat: { color: colors.accent, width: 62 }, error: { color: colors.danger } });
