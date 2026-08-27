import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { registerSchema } from "@fitness-me/shared/auth";
import { Button, Card, Field, Screen, Title } from "@/components/ui";
import { colors } from "@/constants/fitme-theme";
import { useAuth } from "@/lib/auth-context";

export default function Register() {
  const { register } = useAuth(); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() { const parsed = registerSchema.safeParse({ name: name || undefined, email, password, confirmPassword }); if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid data"); setBusy(true); setError(""); try { await register(parsed.data); } catch (e) { setError(e instanceof Error ? e.message : "Registration failed"); } finally { setBusy(false); } }
  return <Screen><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled"><Title sub="Your strongest chapter starts here.">Join FitMe</Title><Card><Field label="Name" value={name} onChangeText={setName}/><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry/><Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry/>{error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}<Button title="Create account" busy={busy} onPress={submit}/><View style={{ alignItems: "center" }}><Link href="/(auth)/login" style={{ color: colors.accent }}>Already have an account?</Link></View></Card></ScrollView></KeyboardAvoidingView></Screen>;
}
