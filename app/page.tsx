"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RequireAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import type { Video } from "@/lib/types";
import { formatTime, parseVideoUrl, youtubeThumb } from "@/lib/video";

type VideoRow = Video & { notes: { count: number }[] };
type NoteHit = { id: string; content: string; seconds: number | null; video_id: string; videos: { title: string } | null };

export default function HomePage() {
  return (
    <RequireAuth>
      <Header />
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoRow[] | null>(null);
  const [link, setLink] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NoteHit[] | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("videos")
      .select("id,url,title,site,thumbnail_url,tags,updated_at,notes(count)")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setVideos((data as VideoRow[]) ?? []));
  }, []);

  // Search inside note text (video titles are filtered locally below).
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const t = setTimeout(async () => {
      const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
      const { data } = await supabase
        .from("notes")
        .select("id,content,seconds,video_id,videos(title)")
        .ilike("content", pattern)
        .order("updated_at", { ascending: false })
        .limit(50);
      setHits((data as unknown as NoteHit[]) ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    videos?.forEach((v) => v.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [videos]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (videos ?? []).filter(
      (v) => (!activeTag || v.tags.includes(activeTag)) && (!q || v.title.toLowerCase().includes(q)),
    );
  }, [videos, activeTag, query]);

  async function addVideo(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    const parsed = parseVideoUrl(link);
    if (!parsed) {
      setAddError("That doesn't look like a link. Paste the full address, e.g. https://www.youtube.com/watch?v=…");
      return;
    }
    setAdding(true);
    const { data: existing } = await supabase.from("videos").select("id").eq("url", parsed.url).maybeSingle();
    if (existing) {
      router.push(`/v/${existing.id}`);
      return;
    }
    let title = `${parsed.site}${new URL(parsed.url).pathname === "/" ? "" : new URL(parsed.url).pathname}`;
    if (parsed.youtubeId) {
      const meta = await fetch(`/api/oembed?url=${encodeURIComponent(parsed.url)}`)
        .then((r) => r.json())
        .catch(() => ({}));
      if (meta.title) title = meta.title;
    }
    const { data, error } = await supabase
      .from("videos")
      .insert({
        url: parsed.url,
        site: parsed.site,
        title,
        thumbnail_url: parsed.youtubeId ? youtubeThumb(parsed.youtubeId) : null,
      })
      .select("id")
      .single();
    setAdding(false);
    if (error) setAddError(error.message);
    else router.push(`/v/${data.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <form onSubmit={addVideo} className="rounded-2xl border border-line bg-surface p-4">
        <label htmlFor="link" className="mb-2 block text-sm font-medium">
          Take notes on a video
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="link"
            className="input"
            placeholder="Paste a YouTube or video link…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            inputMode="url"
          />
          <button className="btn shrink-0" disabled={adding || !link.trim()}>
            {adding ? "Opening…" : "Start notes"}
          </button>
        </div>
        {addError && <p className="mt-2 text-sm text-danger">{addError}</p>}
        <p className="mt-2 text-xs text-muted">
          YouTube videos play right here next to your notes. For other sites, the Chrome extension (coming next) adds a notes panel on the video page.
        </p>
      </form>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="input sm:max-w-sm"
          type="search"
          placeholder="Search all notes and videos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setActiveTag(null)} className={tagClass(activeTag === null)}>
              All
            </button>
            {allTags.map((t) => (
              <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)} className={tagClass(activeTag === t)}>
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {query.trim() && hits && hits.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted">Matching notes</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {hits.map((h) => (
              <li key={h.id}>
                <Link href={`/v/${h.video_id}#note-${h.id}`} className="block px-4 py-3 hover:bg-surface">
                  <div className="text-xs text-muted">
                    {h.videos?.title}
                    {h.seconds != null && <span className="ml-2 font-mono text-accent">{formatTime(h.seconds)}</span>}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-sm">{h.content}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        {videos === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {videos.length === 0 ? "No notes yet. Paste a video link above to start." : hits?.length ? "No video titles match." : "Nothing matches."}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((v) => (
              <li key={v.id}>
                <Link href={`/v/${v.id}`} className="group block overflow-hidden rounded-xl border border-line transition hover:border-accent">
                  <div className="aspect-video bg-surface">
                    {v.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-sm text-muted">{v.site}</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-medium group-hover:text-accent">{v.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <span>{v.site}</span>·<span>{v.notes[0]?.count ?? 0} notes</span>·
                      <span>{new Date(v.updated_at).toLocaleDateString()}</span>
                    </div>
                    {v.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {v.tags.map((t) => (
                          <span key={t} className="chip">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function tagClass(active: boolean) {
  return `rounded-full px-2.5 py-1 text-xs font-medium transition ${
    active ? "bg-accent text-white" : "bg-surface text-muted hover:text-foreground"
  }`;
}
