import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Link } from "expo-router";
import { loginSchema } from "@fitness-me/shared/auth";
import { Button, Card, Field, Screen, Title } from "@/components/ui";
import { colors } from "@/constants/fitme-theme";
import { useAuth } from "@/lib/auth-context";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() { const parsed = loginSchema.safeParse({ email, password }); if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid data"); setBusy(true); setError(""); try { await login(parsed.data); } catch (e) { setError(e instanceof Error ? e.message : "Login failed"); } finally { setBusy(false); } }
  return <Screen><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center" }}><Title sub="Train with intent. Track every rep.">FitMe</Title><Card><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry/>{error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}<Button title="Log in" busy={busy} onPress={submit}/><View style={{ alignItems: "center" }}><Link href="/(auth)/register" style={{ color: colors.accent }}>Create an account</Link></View></Card></KeyboardAvoidingView></Screen>;
}
