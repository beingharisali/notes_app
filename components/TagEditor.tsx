"use client";

import { useState, type KeyboardEvent } from "react";

export function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
    setDraft("");
    if (t && !tags.includes(t)) onChange([...tags, t]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="chip">
          #{t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} className="opacity-60 hover:opacity-100 print:hidden" aria-label={`Remove tag ${t}`}>
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={tags.length ? "+ tag" : "+ add tag (e.g. programming)"}
        className="min-w-24 flex-1 bg-transparent text-xs outline-none placeholder:text-muted print:hidden"
      />
    </div>
  );
}
