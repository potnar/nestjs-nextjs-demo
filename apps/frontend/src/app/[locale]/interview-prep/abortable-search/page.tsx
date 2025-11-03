"use client";

import AbortableSearch from "@/components/AbortableSearch";

export default function Page() {      // ← MUSI być export default
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Abortable fetch demo</h1>
      <AbortableSearch endpoint="https://openlibrary.org/search.json" />
    </div>
  );
}
