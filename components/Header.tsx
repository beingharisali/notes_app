"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

export function Header() {
  const { user } = useAuth();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm text-white">N</span>
          Notes App
        </Link>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{user.email}</span>
            <button onClick={signOut} className="btn-ghost">
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
