import { Suspense } from "react";
import SharedPage from "./SharedNotes";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-8 text-center text-sm text-muted">Loading…</main>}>
      <SharedPage />
    </Suspense>
  );
}
