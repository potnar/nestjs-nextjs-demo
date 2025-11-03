// AbortableSearch.tsx
import { useEffect, useMemo, useRef, useState } from "react";

/** ---------- mały hook do debounce ---------- */
function useDebouncedValue<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/** ---------- komponent demo anulowania fetch ---------- */
type Status = "idle" | "loading" | "success" | "error" | "aborted";

export default function AbortableSearch({ endpoint = "/api/search" }: { endpoint?: string }) {
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 400);

  const ctrlRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  // auto-fetch z debounce; każde nowe zapytanie anuluje poprzednie
  useEffect(() => {
    const query = debounced.trim();
    if (!query) {
      setStatus("idle");
      setData(null);
      setErr(null);
      return;
    }

    // przerwij poprzednie
    ctrlRef.current?.abort();
    const c = new AbortController();
    ctrlRef.current = c;

    setStatus("loading");
    setErr(null);

    fetch(`${endpoint}?q=${encodeURIComponent(query)}`, {
      signal: c.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        setData(json);
        setStatus("success");
      })
      .catch((e: Error) => {
        if (e?.name === "AbortError") {
          setStatus("aborted");
          return;
        }
        setErr(String(e?.message ?? e));
        setStatus("error");
      });

    // cleanup: przerwij, jeśli komponent się odmontuje / zmieni się q
    return () => c.abort();
  }, [debounced, endpoint]);

  const stop = () => ctrlRef.current?.abort();

  const pretty = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Wpisz zapytanie… (każda zmiana anuluje poprzedni fetch)"
          className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none"
        />
        <button
          onClick={stop}
          disabled={status !== "loading"}
          className="px-3 py-2 rounded-xl border bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
          title="Przerwij bieżące żądanie"
        >
          Stop
        </button>
      </div>

      {/* Status + skeleton/typing */}
      <div className="text-xs opacity-70">
        Status:{" "}
        <span
          className={
            status === "loading"
              ? "text-blue-600"
              : status === "error"
              ? "text-red-600"
              : status === "aborted"
              ? "text-yellow-600"
              : "opacity-80"
          }
        >
          {status}
        </span>
      </div>

      {/* Wynik */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3 min-h-24">
        {status === "idle" && <div className="text-sm opacity-70">Czekam na zapytanie…</div>}

        {status === "loading" && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-sm">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span>Ładowanie…</span>
              <span className="animate-pulse">▍</span>
            </div>
            {/* skeleton */}
            <div className="mt-2 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-4/6" />
            </div>
          </div>
        )}

        {status === "success" && (
          <pre className="text-xs whitespace-pre-wrap leading-5 max-h-[60vh] overflow-auto p-3 rounded bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800">
            {pretty}
          </pre>
        )}

        {status === "aborted" && (
          <div className="text-sm">
            Żądanie przerwane. Wpisanie nowego zapytania lub klik &quot;Stop&quot; anuluje fetch (AbortController).
          </div>
        )}

        {status === "error" && <div className="text-sm text-red-600">Błąd: {err}</div>}
      </div>

      {/* Tipy do integracji */}
      <ul className="text-xs opacity-70 list-disc ml-5">
        <li>Każda zmiana pola anuluje poprzednie żądanie (cleanup w <code>useEffect</code>).</li>
        <li>Przycisk &quot;Stop&quot; wywołuje <code>AbortController.abort()</code>.</li>
        <li>Dodaj <code>&quot;DOM&quot;</code> do <code>tsconfig.compilerOptions.lib</code>, jeśli TS krzyczy na <code>AbortController</code>.</li>
      </ul>
    </div>
  );
}
