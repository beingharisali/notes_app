"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExportButtons } from "@/components/ExportButtons";
import { NoteItem } from "@/components/NoteItem";
import { Toast, useFlash } from "@/components/useFlash";
import { YouTubePlayer, type PlayerHandle } from "@/components/YouTubePlayer";
import { supabase } from "@/lib/supabase";
import type { Note, Video } from "@/lib/types";
import { youtubeIdOf } from "@/lib/video";

type Shared = { video: Video; notes: Note[] };

/** Public, read-only view of shared notes. No login needed. */
export default function SharedPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const player = useRef<PlayerHandle>(null);
  const [data, setData] = useState<Shared | null | undefined>(undefined);
  const [msg, flash] = useFlash();

  useEffect(() => {
    supabase.rpc("get_shared_video", { p_share_id: shareId }).then(({ data }) => setData((data as Shared) ?? null));
  }, [shareId]);

  if (data === undefined) return <main className="flex-1 p-8 text-center text-sm text-muted">Loading…</main>;
  if (data === null) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-4 py-16 text-center">
        <p className="text-muted">This link doesn&apos;t exist or sharing was turned off.</p>
        <Link href="/" className="btn mt-4">
          Go to Notes App
        </Link>
      </main>
    );
  }

  const { video, notes } = data;
  const ytId = youtubeIdOf(video.url);

  const list = (
    <ul className="space-y-2">
      {notes.map((n) => (
        <NoteItem key={n.id} note={n} videoUrl={video.url} onSeek={ytId ? (s) => player.current?.seek(s) : undefined} />
      ))}
      {notes.length === 0 && <p className="text-sm text-muted">No notes yet.</p>}
    </ul>
  );

  return (
    <main className={`mx-auto w-full flex-1 px-4 py-6 ${ytId ? "max-w-7xl" : "max-w-3xl"}`}>
      <div className="mb-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted">Shared notes · read only</p>
        <h1 className="text-xl font-semibold sm:text-2xl">{video.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <a href={video.url} target="_blank" rel="noreferrer" className="hover:text-accent">
            {video.site} ↗
          </a>
          <span>{notes.length} notes</span>
          {video.tags.map((t) => (
            <span key={t} className="chip">
              #{t}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1 print:hidden">
          <ExportButtons video={video} notes={notes} flash={flash} />
        </div>
      </div>
      {ytId ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
          <div className="sticky top-0 z-10 -mx-4 self-start bg-background px-4 pb-2 lg:top-6 lg:mx-0 lg:px-0 print:hidden">
            <YouTubePlayer ref={player} videoId={ytId} />
          </div>
          {list}
        </div>
      ) : (
        list
      )}
      <Toast msg={msg} />
    </main>
  );
}
