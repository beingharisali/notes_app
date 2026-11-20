"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RequireAuth } from "@/components/AuthProvider";
import { ExportButtons } from "@/components/ExportButtons";
import { Header } from "@/components/Header";
import { NoteComposer, type ComposerHandle } from "@/components/NoteComposer";
import { NoteItem } from "@/components/NoteItem";
import { TagEditor } from "@/components/TagEditor";
import { Toast, useFlash } from "@/components/useFlash";
import { YouTubePlayer, type PlayerHandle } from "@/components/YouTubePlayer";
import { supabase } from "@/lib/supabase";
import { sortNotes, type Note, type Video } from "@/lib/types";
import { youtubeIdOf } from "@/lib/video";

export default function VideoPage() {
  return (
    <RequireAuth>
      <Header />
      <VideoNotes />
    </RequireAuth>
  );
}

function VideoNotes() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const player = useRef<PlayerHandle>(null);
  const composer = useRef<ComposerHandle>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, flash] = useFlash();

  useEffect(() => {
    Promise.all([
      supabase.from("videos").select("*").eq("id", id).maybeSingle(),
      supabase.from("notes").select("*").eq("video_id", id),
    ]).then(([v, n]) => {
      if (!v.data) return setNotFound(true);
      setVideo(v.data as Video);
      setNotes(sortNotes((n.data as Note[]) ?? []));
      const hash = window.location.hash.match(/^#note-(.+)$/)?.[1];
      if (hash) {
        setHighlight(hash);
        setTimeout(() => document.getElementById(`note-${hash}`)?.scrollIntoView({ block: "center" }), 100);
      }
    });
  }, [id]);

  // Alt+N anywhere on the page jumps to the note box.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        composer.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (notFound) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-4 py-16 text-center">
        <p className="text-muted">This video wasn&apos;t found.</p>
        <Link href="/" className="btn mt-4">
          Back to my notes
        </Link>
      </main>
    );
  }
  if (!video) return <main className="flex-1 p-8 text-center text-sm text-muted">Loading…</main>;

  const ytId = youtubeIdOf(video.url);

  async function updateVideo(patch: Partial<Video>) {
    setVideo((v) => (v ? { ...v, ...patch } : v));
    const { error } = await supabase.from("videos").update(patch).eq("id", id);
    if (error) flash(`Couldn't save: ${error.message}`);
  }

  async function addNote(content: string, seconds: number | null) {
    const { data, error } = await supabase.from("notes").insert({ video_id: id, content, seconds }).select("*").single();
    if (error) {
      flash(`Couldn't save: ${error.message}`);
      return false;
    }
    setNotes((ns) => sortNotes([...ns, data as Note]));
    return true;
  }

  async function updateNote(noteId: string, content: string) {
    setNotes((ns) => ns.map((n) => (n.id === noteId ? { ...n, content } : n)));
    const { error } = await supabase.from("notes").update({ content }).eq("id", noteId);
    flash(error ? `Couldn't save: ${error.message}` : "Saved");
  }

  async function deleteNote(note: Note) {
    setNotes((ns) => ns.filter((n) => n.id !== note.id));
    const { error } = await supabase.from("notes").delete().eq("id", note.id);
    if (error) return flash(`Couldn't delete: ${error.message}`);
    if (note.screenshot_path) await supabase.storage.from("screenshots").remove([note.screenshot_path]);
  }

  async function deleteVideo() {
    const paths = notes.map((n) => n.screenshot_path).filter((p): p is string => !!p);
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) return flash(`Couldn't delete: ${error.message}`);
    if (paths.length) await supabase.storage.from("screenshots").remove(paths);
    router.replace("/");
  }

  const shareUrl = video.share_id ? `${window.location.origin}/s/${video.share_id}` : null;

  async function toggleShare() {
    if (video!.share_id) {
      await updateVideo({ share_id: null });
      flash("Sharing turned off");
    } else {
      const share_id = crypto.randomUUID().replace(/-/g, "");
      await updateVideo({ share_id });
      await navigator.clipboard.writeText(`${window.location.origin}/s/${share_id}`).catch(() => {});
      flash("Share link copied");
    }
  }

  const notesPanel = (
    <div className="space-y-4">
      <NoteComposer ref={composer} player={player} onSave={addNote} />
      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted print:hidden">
          No notes yet. {ytId ? "Play the video and click the box above (or press Alt+N) to add one." : "Add your first note above."}
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              videoUrl={video.url}
              highlighted={highlight === n.id}
              onSeek={ytId ? (s) => player.current?.seek(s) : undefined}
              onUpdate={(c) => updateNote(n.id, c)}
              onDelete={() => deleteNote(n)}
            />
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <main className={`mx-auto w-full flex-1 px-4 py-5 ${ytId ? "max-w-7xl" : "max-w-3xl"}`}>
      <div className="mb-4 space-y-2">
        <Link href="/" className="text-sm text-muted hover:text-foreground print:hidden">
          ← All notes
        </Link>
        <input
          defaultValue={video.title}
          key={video.title}
          onBlur={(e) => {
            const t = e.target.value.trim();
            if (t && t !== video.title) updateVideo({ title: t });
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-full bg-transparent text-xl font-semibold outline-none sm:text-2xl"
          aria-label="Video title"
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <a href={video.url} target="_blank" rel="noreferrer" className="hover:text-accent">
            {video.site} ↗
          </a>
          <span>{notes.length} notes</span>
        </div>
        <TagEditor tags={video.tags} onChange={(tags) => updateVideo({ tags })} />
        <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
          <ExportButtons video={video} notes={notes} flash={flash} />
          <button className={video.share_id ? "btn py-1.5" : "btn-outline"} onClick={toggleShare}>
            {video.share_id ? "Shared ✓" : "Share"}
          </button>
          <button
            className={`btn-ghost ${confirmDelete ? "text-danger" : ""}`}
            onClick={() => (confirmDelete ? deleteVideo() : setConfirmDelete(true))}
            onBlur={() => setConfirmDelete(false)}
          >
            {confirmDelete ? "Delete video & all notes?" : "Delete"}
          </button>
        </div>
        {shareUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-xs print:hidden">
            <span className="shrink-0 text-accent">Anyone with this link can view:</span>
            <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent font-mono outline-none" />
            <button
              className="font-medium text-accent"
              onClick={() => navigator.clipboard.writeText(shareUrl).then(() => flash("Link copied"))}
            >
              Copy
            </button>
          </div>
        )}
      </div>

      {ytId ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
          <div className="sticky top-14 z-10 -mx-4 self-start bg-background px-4 pb-2 lg:top-20 lg:mx-0 lg:px-0 print:hidden">
            <YouTubePlayer ref={player} videoId={ytId} />
          </div>
          {notesPanel}
        </div>
      ) : (
        notesPanel
      )}
      <Toast msg={msg} />
    </main>
  );
}
