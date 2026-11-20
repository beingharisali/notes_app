import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export function screenshotUrl(path: string): string {
  return supabase.storage.from("screenshots").getPublicUrl(path).data.publicUrl;
}
