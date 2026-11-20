"use client";

import { useImperativeHandle, useRef, useState, type FocusEvent, type KeyboardEvent, type Ref, type RefObject } from "react";
import type { PlayerHandle } from "./YouTubePlayer";
import { autosize } from "./NoteItem";
import { formatTime, parseTime } from "@/lib/video";

export type ComposerHandle = { focus(): void };

type Props = {
  player: RefObject<PlayerHandle | null>;
  onSave: (content: string, seconds: number | null) => Promise<boolean>;
  ref?: Ref<ComposerHandle>;
};

/**
 * Focusing the box pauses the video and grabs the current time.
 * Enter saves and resumes the video. Shift+Enter = new line. Esc = cancel and resume.
 */
export function NoteComposer({ player, onSave, ref }: Props) {
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const active = useRef(false);
  const wasPlaying = useRef(false);

  useImperativeHandle(ref, () => ({ focus: () => textRef.current?.focus() }));

  function start() {
    if (active.current) return;
    active.current = true;
    const p = player.current;
    if (!p) return;
    const t = p.getTime();
    if (t != null) setTime(formatTime(t));
    if (p.isPlaying()) {
      wasPlaying.current = true;
      p.pause();
    }
  }

  function finish() {
    active.current = false;
    if (wasPlaying.current) player.current?.play();
    wasPlaying.current = false;
  }

  function onBlur(e: FocusEvent) {
    if (formRef.current?.contains(e.relatedTarget as Node)) return;
    if (!text.trim()) finish();
  }

  async function save() {
    const content = text.trim();
    if (!content || saving) return;
    setSaving(true);
    const ok = await onSave(content, parseTime(time));
    setSaving(false);
    if (!ok) return;
    setText("");
    setTime("");
    requestAnimationFrame(() => autosize(textRef.current));
    finish();
    textRef.current?.blur();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      finish();
      textRef.current?.blur();
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="rounded-xl border border-line bg-surface p-3 focus-within:border-accent print:hidden"
    >
      <textarea
        ref={textRef}
        rows={2}
        value={text}
        placeholder="Write a note… (Enter to save, Shift+Enter for a new line)"
        onFocus={start}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          setText(e.target.value);
          autosize(e.target);
        }}
        className="block w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted" title="Timestamp for this note (mm:ss). Leave empty for none.">
          ⏱
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onBlur={onBlur}
            placeholder="0:00"
            className="w-16 rounded-md border border-line bg-background px-1.5 py-0.5 font-mono text-xs outline-none focus:border-accent"
          />
          {time && parseTime(time) == null && <span className="text-danger">use mm:ss</span>}
        </label>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted sm:inline">Alt+N to focus</span>
          <button className="btn py-1.5" disabled={!text.trim() || saving} onBlur={onBlur}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
