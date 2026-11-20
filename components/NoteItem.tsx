"use client";

import { useEffect, useRef, useState } from "react";
import { screenshotUrl } from "@/lib/supabase";
import type { Note } from "@/lib/types";
import { formatTime, timeLink } from "@/lib/video";

type Props = {
  note: Note;
  videoUrl: string;
  onSeek?: (seconds: number) => void;
  onUpdate?: (content: string) => void;
  onDelete?: () => void;
  highlighted?: boolean;
};

export function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function NoteItem({ note, videoUrl, onSeek, onUpdate, onDelete, highlighted }: Props) {
  const [text, setText] = useState(note.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const editable = !!onUpdate;

  useEffect(() => autosize(ref.current), [text]);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <li
      id={`note-${note.id}`}
      className={`group flex gap-3 rounded-xl border p-3 transition break-inside-avoid ${
        highlighted ? "border-accent bg-accent-soft/40" : "border-line"
      }`}
    >
      <div className="w-14 shrink-0 pt-0.5">
        {note.seconds != null &&
          (onSeek ? (
            <button onClick={() => onSeek(note.seconds!)} className="chip font-mono hover:opacity-80" title="Jump to this moment">
              {formatTime(note.seconds)}
            </button>
          ) : (
            <a href={timeLink(videoUrl, note.seconds)} target="_blank" rel="noreferrer" className="chip font-mono hover:opacity-80" title="Open video at this moment">
              {formatTime(note.seconds)}
            </a>
          ))}
      </div>

      <div className="min-w-0 flex-1">
        {editable ? (
          <textarea
            ref={ref}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => text.trim() !== note.content && text.trim() && onUpdate!(text.trim())}
            className="block w-full resize-none bg-transparent text-sm leading-6 outline-none"
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6">{note.content}</p>
        )}
        {note.screenshot_path && (
          <a href={screenshotUrl(note.screenshot_path)} target="_blank" rel="noreferrer" className="mt-2 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screenshotUrl(note.screenshot_path)} alt="Video screenshot" className="max-h-64 rounded-lg border border-line" />
          </a>
        )}
      </div>

      {onDelete && (
        <button
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          className={`self-start text-xs transition print:hidden ${
            confirmDelete ? "font-medium text-danger" : "text-muted opacity-100 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
          }`}
          title="Delete note"
        >
          {confirmDelete ? "Delete?" : "✕"}
        </button>
      )}
    </li>
  );
}
