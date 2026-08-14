export type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function askCoach(messages: CoachMessage[], lang: "en" | "ru") {
  const token = sessionStorage.getItem("accessToken");
  const response = await fetch("/api/ai/coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, lang }),
  });

  const data = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
  if (!response.ok || !data?.message) {
    throw new Error(data?.error ?? "The AI coach is unavailable.");
  }

  return data.message;
}
