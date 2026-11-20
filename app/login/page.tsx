"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else if (!data.session) setInfo("Account created. Check your email and click the confirmation link, then sign in.");
    }
    setBusy(false);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent text-lg font-semibold text-white">N</div>
          <h1 className="text-2xl font-semibold">Notes App</h1>
          <p className="mt-1 text-sm text-muted">Timestamped notes for every video you watch.</p>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line p-6">
          <div className="mb-2 grid grid-cols-2 rounded-lg bg-surface p-1 text-sm">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                }}
                className={`rounded-md py-1.5 font-medium transition ${mode === m ? "bg-background shadow-sm" : "text-muted"}`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Password</span>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-accent">{info}</p>}
          <button className="btn w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
