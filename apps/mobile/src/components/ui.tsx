import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps } from "react-native";
import { colors } from "@/constants/fitme-theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return <View style={styles.titleWrap}><Text style={styles.title}>{children}</Text>{sub ? <Text style={styles.sub}>{sub}</Text> : null}</View>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={colors.muted} style={[styles.input, error && styles.inputError]} {...props}/>{error ? <Text style={styles.error}>{error}</Text> : null}</View>;
}

export function Button({ title, busy, variant = "primary", ...props }: PressableProps & { title: string; busy?: boolean; variant?: "primary" | "ghost" | "danger" }) {
  return <Pressable style={({ pressed }) => [styles.button, variant !== "primary" && styles.ghost, pressed && styles.pressed]} disabled={busy || props.disabled} {...props}>{busy ? <ActivityIndicator color={colors.bg}/> : <Text style={[styles.buttonText, variant !== "primary" && styles.ghostText, variant === "danger" && styles.danger]}>{title}</Text>}</Pressable>;
}

export const ui = StyleSheet.create({ text: { color: colors.text }, sub: { color: colors.sub }, row: { flexDirection: "row", gap: 10 }, grow: { flex: 1 } });

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  titleWrap: { marginBottom: 22, gap: 4 }, title: { color: colors.text, fontSize: 34, fontWeight: "900", textTransform: "uppercase", letterSpacing: -1 }, sub: { color: colors.sub, fontSize: 14 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  field: { gap: 7 }, label: { color: colors.sub, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  input: { color: colors.text, backgroundColor: colors.input, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, minHeight: 50 }, inputError: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 12 },
  button: { minHeight: 50, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }, ghost: { backgroundColor: "transparent", borderColor: colors.border, borderWidth: 1 }, pressed: { opacity: .75 },
  buttonText: { color: colors.bg, fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: .8 }, ghostText: { color: colors.text }, danger: { color: colors.danger },
});
