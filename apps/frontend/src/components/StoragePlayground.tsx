"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

/**
 * StoragePlayground – interaktywny pokaz różnic między:
 * - localStorage (trwałe, per origin, tylko JS)
 * - sessionStorage (do zamknięcia karty/okna, per origin+tab)
 * - Cookies (wysyłane do serwera; atrybuty: Expires/Max-Age, Path, Domain, SameSite, Secure)
 */

const bytelength = (s: string) => new TextEncoder().encode(s).length;
const isMetaKey = (k: string) => k.startsWith("__cookie_meta__:");

type CookieMeta = {
  path?: string;
  domain?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
  maxAge?: number;
};

const metaKey = (name: string) => `__cookie_meta__:${name}`;
const saveCookieMeta = (name: string, meta: CookieMeta) => {
  try { localStorage.setItem(metaKey(name), JSON.stringify(meta)); } catch {}
};
const loadCookieMeta = (name: string): CookieMeta | undefined => {
  try { const v = localStorage.getItem(metaKey(name)); return v ? JSON.parse(v) : undefined; } catch { return undefined; }
};

function setCookie(name: string, value: string, meta: CookieMeta) {
  const parts: string[] = [];
  parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  if (meta.maxAge != null && Number.isFinite(meta.maxAge)) parts.push(`Max-Age=${Math.max(0, Math.floor(meta.maxAge!))}`);
  if (meta.path) parts.push(`Path=${meta.path}`); else parts.push("Path=/");
  if (meta.domain) parts.push(`Domain=${meta.domain}`);
  if (meta.sameSite) parts.push(`SameSite=${meta.sameSite}`);
  if (meta.secure) parts.push("Secure");
  document.cookie = parts.join("; ");
  saveCookieMeta(name, meta);
}

function deleteCookie(name: string, meta?: CookieMeta) {
  const m = meta || loadCookieMeta(name) || {};
  const parts: string[] = [];
  parts.push(`${encodeURIComponent(name)}=`);
  parts.push("Max-Age=0");
  parts.push(`Path=${m.path || "/"}`);
  if (m.domain) parts.push(`Domain=${m.domain}`);
  if (m.sameSite) parts.push(`SameSite=${m.sameSite}`);
  if (m.secure) parts.push("Secure");
  document.cookie = parts.join("; ");
}

function listCookies(): { name: string; value: string; meta?: CookieMeta }[] {
  const raw = document.cookie || "";
  if (!raw) return [];
  return raw.split(/;\s*/).map(kv => {
    const idx = kv.indexOf("=");
    const name = decodeURIComponent(idx >= 0 ? kv.slice(0, idx) : kv);
    const value = decodeURIComponent(idx >= 0 ? kv.slice(idx + 1) : "");
    return { name, value, meta: loadCookieMeta(name) };
  });
}

export default function StoragePlayground() {
  // forms
  const [lsKey, setLsKey] = useState("demo");
  const [lsVal, setLsVal] = useState("hello-local");
  const [ssKey, setSsKey] = useState("demo");
  const [ssVal, setSsVal] = useState("hello-session");

  const [ckKey, setCkKey] = useState("demo");
  const [ckVal, setCkVal] = useState("hello-cookie");
  const [ckPath, setCkPath] = useState("/");
  const [ckDomain, setCkDomain] = useState("");
  const [ckSameSite, setCkSameSite] = useState<"Lax" | "Strict" | "None">("Lax");
  const [ckSecure, setCkSecure] = useState(false);
  const [ckMaxAge, setCkMaxAge] = useState<number>(3600);

  // data snapshots
  const [lsItems, setLsItems] = useState<{ key: string; value: string }[]>([]);
  const [ssItems, setSsItems] = useState<{ key: string; value: string }[]>([]);
  const [cookies, setCookies] = useState<{ name: string; value: string; meta?: CookieMeta }[]>([]);

  // refresh
  const refreshLS = useCallback(() => {
    const arr: { key: string; value: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (isMetaKey(k)) continue;
      const v = localStorage.getItem(k) ?? "";
      arr.push({ key: k, value: v });
    }
    arr.sort((a, b) => a.key.localeCompare(b.key));
    setLsItems(arr);
  }, []);

  const refreshSS = useCallback(() => {
    const arr: { key: string; value: string }[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)!;
      const v = sessionStorage.getItem(k) ?? "";
      arr.push({ key: k, value: v });
    }
    arr.sort((a, b) => a.key.localeCompare(b.key));
    setSsItems(arr);
  }, []);

  const refreshCookies = useCallback(() => {
    const arr = listCookies().sort((a, b) =>
      a.name === b.name ? a.value.localeCompare(b.value) : a.name.localeCompare(b.name)
    );
    setCookies(arr);
  }, []);

  // init + polling for cookies (brak eventu change)
  useEffect(() => {
    refreshLS();
    refreshSS();
    refreshCookies();
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea === localStorage) refreshLS();
      if (e.storageArea === sessionStorage) refreshSS();
    };
    window.addEventListener("storage", onStorage);
    const iv = window.setInterval(refreshCookies, 1000);
    return () => { window.removeEventListener("storage", onStorage); window.clearInterval(iv); };
  }, [refreshLS, refreshSS, refreshCookies]);

  // derived stats
  const lsBytes = useMemo(() => lsItems.reduce((n, it) => n + bytelength(it.key) + bytelength(it.value), 0), [lsItems]);
  const ssBytes = useMemo(() => ssItems.reduce((n, it) => n + bytelength(it.key) + bytelength(it.value), 0), [ssItems]);
  const cookieHeader = useMemo(() => cookies.map(c => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`).join("; "), [cookies]);
  const cookieBytes = useMemo(() => bytelength(cookieHeader), [cookieHeader]);

  // actions
  const openNewTab = () => { try { window.open(window.location.href, "_blank", "noreferrer"); } catch {} };

  const setLS = () => { try { localStorage.setItem(lsKey, lsVal); } catch {} refreshLS(); };
  const delLS = (key: string) => { try { localStorage.removeItem(key); } catch {} refreshLS(); };
  const clearLS = () => {
    try {
      // czyść tylko „normalne” klucze – zostaw metadane ciastek
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (!isMetaKey(k)) toDelete.push(k);
      }
      toDelete.forEach((k) => localStorage.removeItem(k));
    } catch {}
    refreshLS();
  };

  const setSS = () => { try { sessionStorage.setItem(ssKey, ssVal); } catch {} refreshSS(); };
  const delSS = (key: string) => { try { sessionStorage.removeItem(key); } catch {} refreshSS(); };
  const clearSS = () => { try { sessionStorage.clear(); } catch {} refreshSS(); };

  const setCK = () => {
    setCookie(ckKey, ckVal, { path: ckPath || "/", domain: ckDomain || undefined, sameSite: ckSameSite, secure: ckSecure, maxAge: ckMaxAge });
    refreshCookies();
  };
  const delCK = (name: string) => { deleteCookie(name); refreshCookies(); };
  const clearCK = () => { cookies.forEach(c => deleteCookie(c.name)); refreshCookies(); };

  return (
    <div className="space-y-6">
      {/* top explainer */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/40 text-sm">
        <div className="font-semibold mb-2">Co tu porównujemy?</div>
        <ul className="grid md:grid-cols-3 gap-3 list-disc ml-5">
          <li><b>localStorage</b>: trwałe, per origin; dostępne w JS; <i>nie</i> wysyłane do serwera.</li>
          <li><b>sessionStorage</b>: per origin <i>i</i> per karta/okno; znika po zamknięciu karty.</li>
          <li><b>Cookies</b>: wysyłane z każdym żądaniem HTTP do tej domeny/ścieżki; mają atrybuty (Expires/Max-Age, Path, Domain, SameSite, Secure).</li>
        </ul>
        <div className="mt-2 flex gap-2">
          <button onClick={openNewTab} className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border hover:shadow">Otwórz ten sam widok w nowej karcie →</button>
          <div className="text-xs opacity-70 self-center">W nowej karcie zobaczysz: localStorage i cookies zachowane; sessionStorage puste.</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LOCAL STORAGE */}
        <Panel title="localStorage" subtitle={`Items: ${lsItems.length} • ~${lsBytes} B`}>
          <KVForm kind="LS" k={lsKey} v={lsVal} onK={setLsKey} onV={setLsVal} onSet={setLS} onClear={clearLS} />
          <List items={lsItems.map(({key, value}) => ({ key, value }))} onDelete={delLS} />
        </Panel>

        {/* SESSION STORAGE */}
        <Panel title="sessionStorage" subtitle={`Items: ${ssItems.length} • ~${ssBytes} B`}>
          <KVForm kind="SS" k={ssKey} v={ssVal} onK={setSsKey} onV={setSsVal} onSet={setSS} onClear={clearSS} />
          <List items={ssItems.map(({key, value}) => ({ key, value }))} onDelete={delSS} />
        </Panel>

        {/* COOKIES */}
        <Panel title="Cookies" subtitle={`Cookie header: ~${cookieBytes} B`}>
          <CookieForm
            k={ckKey} v={ckVal}
            path={ckPath} domain={ckDomain}
            sameSite={ckSameSite} secure={ckSecure} maxAge={ckMaxAge}
            onK={setCkKey} onV={setCkVal}
            onPath={setCkPath} onDomain={setCkDomain}
            onSameSite={setCkSameSite} onSecure={setCkSecure} onMaxAge={setCkMaxAge}
            onSet={setCK} onClear={clearCK}
          />
          <CookieList items={cookies} onDelete={delCK} />
          <div className="mt-2 text-xs opacity-80">
            <div className="font-medium mb-1">Symulowany nagłówek żądania:</div>
            <div className="rounded bg-white dark:bg-gray-800 border px-2 py-1 overflow-auto">Cookie: {cookieHeader || ""}</div>
            <div className="opacity-60 mt-1">Uwaga: w realnych requestach nagłówek jest dołączany automatycznie przez przeglądarkę zgodnie z regułami domeny/ścieżki/SameSite.</div>
          </div>
        </Panel>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-xs opacity-80">
        <InfoCard title="Rozmiary / limity">
          <ul className="list-disc ml-5 space-y-1">
            <li>Cookies: zwykle ~4 KB na ciasteczko; wszystkie ciasteczka trafiają do nagłówka <code>Cookie</code>.</li>
            <li>localStorage/sessionStorage: implementacje dają zwykle kilka MB na origin (zależnie od przeglądarki).</li>
            <li>Warto liczyć bajty – patrz liczniki powyżej.</li>
          </ul>
        </InfoCard>
        <InfoCard title="Bezpieczeństwo">
          <ul className="list-disc ml-5 space-y-1">
            <li>Cookies mogą mieć flagę <code>HttpOnly</code> (niedostępne w JS) – nie można jej ustawić z JS; robi to serwer.</li>
            <li><code>SameSite=None</code> zwykle wymaga <code>Secure</code> (HTTPS).</li>
            <li>Dane w LS/SS nie idą do serwera automatycznie – ale uważaj na XSS.</li>
          </ul>
        </InfoCard>
        <InfoCard title="Zakres i czas życia">
          <ul className="list-disc ml-5 space-y-1">
            <li>sessionStorage żyje do zamknięcia karty/okna (spróbuj przycisku „nowa karta”).</li>
            <li>localStorage trwa, dopóki użytkownik/strona go nie wyczyści.</li>
            <li>Cookies: sterujesz <code>Expires/Max-Age</code>, dodatkowo Path/Domain ograniczają widoczność.</li>
          </ul>
        </InfoCard>
      </div>
    </div>
  );
}

/** ------------------------------ pieces ------------------------------ */
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function KVForm({
  kind, k, v, onK, onV, onSet, onClear,
}: {
  kind: "LS" | "SS";
  k: string; v: string;
  onK: (s: string) => void; onV: (s: string) => void;
  onSet: () => void; onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs opacity-70 w-full sm:w-auto">Key</span>
      <input value={k} onChange={e => onK(e.target.value)} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800" />
      <span className="text-xs opacity-70 w-full sm:w-auto">Value</span>
      <input value={v} onChange={e => onV(e.target.value)} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800" />
      <button onClick={onSet} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:shadow">Set {kind}</button>
      <button onClick={onClear} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:shadow">Clear all</button>
    </div>
  );
}

function List({ items, onDelete }: { items: { key: string; value: string }[]; onDelete: (k: string) => void }) {
  if (!items.length) return <div className="text-xs opacity-60">(empty)</div>;
  return (
    <div className="text-xs divide-y divide-gray-200 dark:divide-gray-800 rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
      {items.map(it => (
        <div key={it.key} className="px-2 py-1 flex gap-2 items-center">
          <code className="bg-gray-50 dark:bg-gray-900/40 px-1 rounded">{it.key}</code>
          <span className="opacity-80 break-all">{it.value}</span>
          <span className="ml-auto opacity-60">~{bytelength(it.key) + bytelength(it.value)} B</span>
          <button onClick={() => onDelete(it.key)} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">🗑</button>
        </div>
      ))}
    </div>
  );
}

function CookieForm({
  k, v, path, domain, sameSite, secure, maxAge,
  onK, onV, onPath, onDomain, onSameSite, onSecure, onMaxAge,
  onSet, onClear,
}: {
  k: string; v: string; path: string; domain: string; sameSite: "Lax" | "Strict" | "None"; secure: boolean; maxAge: number;
  onK: (s: string) => void; onV: (s: string) => void;
  onPath: (s: string) => void; onDomain: (s: string) => void;
  onSameSite: (s: "Lax" | "Strict" | "None") => void; onSecure: (b: boolean) => void; onMaxAge: (n: number) => void;
  onSet: () => void; onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <label className="text-xs opacity-70 w-full sm:w-auto">Key</label>
        <input value={k} onChange={e => onK(e.target.value)} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800" />
        <label className="text-xs opacity-70 w-full sm:w-auto">Value</label>
        <input value={v} onChange={e => onV(e.target.value)} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800" />
        <label className="text-xs opacity-70 w-full sm:w-auto">Path</label>
        <input value={path} onChange={e => onPath(e.target.value)} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 w-24" />
        <label className="text-xs opacity-70 w-full sm:w-auto">Domain</label>
        <input value={domain} onChange={e => onDomain(e.target.value)} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 w-36" placeholder="(optional)" />
      </div>
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <label className="text-xs opacity-70 w-full sm:w-auto">SameSite</label>
        <select
          value={sameSite}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onSameSite(e.target.value as "Lax" | "Strict" | "None")
          }
          className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800"
        >
          <option value="Lax">Lax</option>
          <option value="Strict">Strict</option>
          <option value="None">None</option>
        </select>
        <label className="text-xs opacity-70">Secure</label>
        <input type="checkbox" checked={secure} onChange={e => onSecure(e.target.checked)} />
        <label className="text-xs opacity-70">Max-Age (s)</label>
        <input type="number" value={maxAge} min={0} step={60} onChange={e => onMaxAge(parseInt(e.target.value || "0", 10))} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 w-28" />
        <button onClick={onSet} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:shadow">Set cookie</button>
        <button onClick={onClear} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:shadow">Clear all</button>
      </div>
      <div className="text-xs opacity-70">
        Uwaga: <code>HttpOnly</code> nie może być ustawione z JavaScript – tylko serwer.
        Dla <code>SameSite=None</code> zazwyczaj wymagane jest <code>Secure</code> (HTTPS).
      </div>
    </div>
  );
}

function CookieList({
  items,
  onDelete,
}: {
  items: { name: string; value: string; meta?: CookieMeta }[];
  onDelete: (name: string) => void;
}) {
  if (!items.length) return <div className="text-xs opacity-60">(no cookies)</div>;
  return (
    <div className="text-xs divide-y divide-gray-200 dark:divide-gray-800 rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
      {items.map((c, i) => (
        <div key={`${c.name}:${c.value}:${i}`} className="px-2 py-1 grid grid-cols-[auto_1fr_auto] items-start gap-2">
          <code className="bg-gray-50 dark:bg-gray-900/40 px-1 rounded">{c.name}</code>
          <span className="opacity-80 break-all">{c.value}</span>
          <span className="opacity-60">~{bytelength(c.name) + bytelength(c.value)} B</span>
          <div className="col-span-3 ml-1 opacity-70">
            <span className="mr-2">Path: {c.meta?.path || "/"}</span>
            {c.meta?.domain && <span className="mr-2">Domain: {c.meta.domain}</span>}
            {c.meta?.sameSite && <span className="mr-2">SameSite: {c.meta.sameSite}</span>}
            {c.meta?.secure && <span className="mr-2">Secure</span>}
            {typeof c.meta?.maxAge === "number" && <span>Max-Age: {c.meta!.maxAge}s</span>}
            {!c.meta && <span className="ml-2 px-1 rounded bg-gray-200 dark:bg-gray-700 text-[10px]">external</span>}
          </div>
          <div className="col-span-3 text-right">
            <button onClick={() => onDelete(c.name)} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">🗑 Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-900/40">
      <div className="font-semibold mb-1">{title}</div>
      <div>{children}</div>
    </div>
  );
}
