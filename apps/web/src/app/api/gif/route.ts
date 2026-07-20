import { NextRequest } from "next/server";

/**
 * Тонкий прокси для картинок из источников, требующих ключ (напр. WorkoutX).
 * free-exercise-db (raw.githubusercontent.com) сюда НЕ ходит — грузится напрямую
 * из gifUrl(), см. src/utils.ts. Никакого Redis на фронте: кэшируют браузер и CDN.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response("missing url", { status: 400 });

  const headers: Record<string, string> = {};
  const wxKey = process.env.NEXT_PUBLIC_WORKOUTX_API_KEY;
  if (wxKey && url.includes("workoutxapp")) headers["X-WorkoutX-Key"] = wxKey;

  const upstream = await fetch(url, { headers });
  if (!upstream.ok) {
    return new Response("upstream error", { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      // Картинки упражнений неизменны → год, immutable. Браузер тянет один раз.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
