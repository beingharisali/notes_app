"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Tiny toast: flash("Copied!") shows a message for 2 seconds. */
export function useFlash(): [string | null, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [msg, flash];
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg print:hidden">
      {msg}
    </div>
  );
}
