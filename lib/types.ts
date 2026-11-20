export type Video = {
  id: string;
  user_id?: string;
  url: string;
  title: string;
  site: string;
  thumbnail_url: string | null;
  tags: string[];
  share_id?: string | null;
  created_at?: string;
  updated_at: string;
};

export type Note = {
  id: string;
  video_id: string;
  content: string;
  seconds: number | null;
  screenshot_path: string | null;
  created_at: string;
  updated_at: string;
};

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.seconds == null && b.seconds != null) return 1;
    if (b.seconds == null && a.seconds != null) return -1;
    if (a.seconds != null && b.seconds != null && a.seconds !== b.seconds) return a.seconds - b.seconds;
    return a.created_at.localeCompare(b.created_at);
  });
}
