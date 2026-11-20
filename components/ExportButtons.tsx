"use client";

import { copyNotes, downloadFile, safeFilename, toMarkdown, toPlainText } from "@/lib/export";
import type { Note, Video } from "@/lib/types";

type Props = { video: Pick<Video, "title" | "url" | "tags">; notes: Note[]; flash: (m: string) => void };

export function ExportButtons({ video, notes, flash }: Props) {
  const name = safeFilename(video.title);
  return (
    <>
      <button
        className="btn-outline"
        title="Copy formatted notes, ready to paste into Notion or Google Docs"
        onClick={async () => {
          await copyNotes(video, notes);
          flash("Copied! Paste into Notion, Google Docs…");
        }}
      >
        Copy
      </button>
      <button className="btn-outline" onClick={() => downloadFile(`${name}.md`, toMarkdown(video, notes), "text/markdown")}>
        .md
      </button>
      <button className="btn-outline" onClick={() => downloadFile(`${name}.txt`, toPlainText(video, notes), "text/plain")}>
        .txt
      </button>
      <button className="btn-outline" title="Print or save as PDF" onClick={() => window.print()}>
        PDF
      </button>
    </>
  );
}
