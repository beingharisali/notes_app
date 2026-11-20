export type ParsedVideo = { url: string; site: string; youtubeId: string | null };

const STRIP_PARAMS = ["t", "start", "si", "feature", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

/** Normalize a video link so the same video always maps to the same notes. */
export function parseVideoUrl(input: string): ParsedVideo | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^(www|m)\./, "");

  let yt: string | null = null;
  if (host === "youtu.be") {
    yt = u.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") yt = u.searchParams.get("v");
    else yt = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)?.[1] ?? null;
  }
  if (yt && /^[\w-]{11}$/.test(yt)) {
    return { url: `https://www.youtube.com/watch?v=${yt}`, site: "youtube.com", youtubeId: yt };
  }

  u.hash = "";
  STRIP_PARAMS.forEach((p) => u.searchParams.delete(p));
  return { url: u.toString(), site: host, youtubeId: null };
}

export function youtubeIdOf(url: string): string | null {
  return parseVideoUrl(url)?.youtubeId ?? null;
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function formatTime(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "12:34", "1:02:03" or "95" -> seconds. Empty/invalid -> null. */
export function parseTime(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(t)) return null;
  return t.split(":").reduce((acc, part) => acc * 60 + Number(part), 0);
}

/** Link that opens the original video at a moment. */
export function timeLink(url: string, seconds: number): string {
  const s = Math.floor(seconds);
  try {
    const u = new URL(url);
    if (youtubeIdOf(url)) {
      u.searchParams.set("t", `${s}s`);
      return u.toString();
    }
    u.hash = `t=${s}`;
    return u.toString();
  } catch {
    return url;
  }
}
