import type { NextRequest } from "next/server";

/** Looks up a YouTube video's title (YouTube's oEmbed can't be called from the browser directly). */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return Response.json({ error: "missing url" }, { status: 400 });
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
    if (!r.ok) return Response.json({});
    const j = await r.json();
    return Response.json({ title: j.title ?? null, author: j.author_name ?? null });
  } catch {
    return Response.json({});
  }
}
