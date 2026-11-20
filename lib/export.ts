import { screenshotUrl } from "./supabase";
import type { Note, Video } from "./types";
import { formatTime, timeLink } from "./video";

type V = Pick<Video, "title" | "url" | "tags">;

export function toMarkdown(v: V, notes: Note[]): string {
  const out = [`# ${v.title}`, "", `Source: ${v.url}`];
  if (v.tags.length) out.push(`Tags: ${v.tags.map((t) => `#${t}`).join(" ")}`);
  out.push("");
  for (const n of notes) {
    const ts = n.seconds != null ? `[${formatTime(n.seconds)}](${timeLink(v.url, n.seconds)}) ` : "";
    const [first, ...rest] = n.content.split("\n");
    out.push(`- ${ts}${first}`);
    rest.forEach((line) => out.push(`  ${line}`));
    if (n.screenshot_path) out.push(`  ![screenshot](${screenshotUrl(n.screenshot_path)})`);
  }
  return out.join("\n") + "\n";
}

export function toPlainText(v: V, notes: Note[]): string {
  const out = [v.title, v.url, ""];
  for (const n of notes) {
    const ts = n.seconds != null ? `[${formatTime(n.seconds)}] ` : "";
    out.push(`${ts}${n.content}`);
    out.push("");
  }
  return out.join("\n");
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function toHtml(v: V, notes: Note[]): string {
  const items = notes
    .map((n) => {
      const ts =
        n.seconds != null
          ? `<a href="${esc(timeLink(v.url, n.seconds))}">${formatTime(n.seconds)}</a> — `
          : "";
      const img = n.screenshot_path ? `<br><img src="${esc(screenshotUrl(n.screenshot_path))}" alt="screenshot">` : "";
      return `<li>${ts}${esc(n.content).replace(/\n/g, "<br>")}${img}</li>`;
    })
    .join("");
  const tags = v.tags.length ? `<p>Tags: ${esc(v.tags.map((t) => `#${t}`).join(" "))}</p>` : "";
  return `<h1>${esc(v.title)}</h1><p>Source: <a href="${esc(v.url)}">${esc(v.url)}</a></p>${tags}<ul>${items}</ul>`;
}

/** Copies formatted notes. Pastes nicely into Notion, Google Docs, Word, etc. */
export async function copyNotes(v: V, notes: Note[]): Promise<void> {
  const md = toMarkdown(v, notes);
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([toHtml(v, notes)], { type: "text/html" }),
        "text/plain": new Blob([md], { type: "text/plain" }),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText(md);
  }
}

export function safeFilename(title: string): string {
  return title.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "notes";
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
