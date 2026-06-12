import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response("missing url", { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_WORKOUTX_API_KEY;
  if (!apiKey) return new Response("WORKOUTX_API_KEY not set", { status: 500 });

  const upstream = await fetch(url, {
    headers: { "X-WorkoutX-Key": apiKey },
  });

  if (!upstream.ok) {
    return new Response("upstream error", { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/gif",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

