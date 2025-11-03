"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * SSOExplainer – prosta, dwupanelowa wizualizacja:
 * 1) Po lewej: drzewo "dokumentacji" SSO (małe, zwięzłe pliki).
 * 2) Po prawej: viewer, który pokazuje treść wybranego pliku.
 * 3) Nad drzewem: krótki opis kroków (light intro), żeby szybko zrozumieć flow.
 *
 * Zależności: tylko React + Tailwind (jak reszta projektu). Bez dodatkowych bibliotek.
 * Jeśli chcesz, rozbij ten plik na folder:
 *   src/components/sso/SSOExplainer.tsx
 *   src/components/sso/DocTree.tsx
 *   src/components/sso/FileViewer.tsx
 *   src/components/sso/data.ts
 */

/** ---------------------- Types ---------------------- */
export type DocNode = {
  id: string;
  name: string;
  type: "directory" | "file";
  children?: DocNode[];
  content?: string; // tylko dla plików
};

/** ---------------------- Helpers ---------------------- */
const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const dir = (name: string, children: DocNode[] = []): DocNode => ({ id: newId(), name, type: "directory", children });
const file = (name: string, content: string): DocNode => ({ id: newId(), name, type: "file", content });

/** ---------------------- Data: minimalna dokumentacja ---------------------- */
function buildDocs(): DocNode {
  return dir("sso-docs", [
    dir("00-overview", [
      file(
        "01-what-is-sso.md",
        `# What is SSO?\n\nSingle Sign-On to wygodny sposób logowania do wielu aplikacji \nza pomocą jednej tożsamości (IdP: Identity Provider).\nNajczęściej opieramy się na OAuth 2.1 + OIDC.\n\n**Skrót flow (Authorization Code + PKCE):**\n1) Klient buduje URL /authorize i przekierowuje użytkownika do IdP.\n2) Po logowaniu IdP odsyła code do /callback.\n3) Backend wymienia code → access_token (i id_token).\n4) Aplikacja ustawia sesję (cookie) i korzysta z API.\n\n`),
    ]),
    dir("01-protocols", [
      file(
        "01-oauth-vs-oidc.md",
        `# OAuth vs OIDC\n\n- **OAuth 2.x**: delegacja autoryzacji (tokeny dostępu).\n- **OIDC**: warstwa identity nad OAuth – dostajesz **id_token** (JWT) z info o użytkowniku.\n`),
      file(
        "02-pkce.md",
        `# PKCE (Proof Key for Code Exchange)\n\nZapobiega przechwyceniu code w aplikacjach publicznych.\nKlient generuje \`code_verifier\` i \`code_challenge\` (S256).\nW /token IdP weryfikuje zgodność.\n`),
    ]),
    dir("02-flow", [
      file(
        "01-authorize-url.http",
        `GET https://idp.example.com/authorize\\\n  ?response_type=code\\\n  &client_id=YOUR_CLIENT_ID\\\n  &redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fauth%2Fcallback%2Fprovider\\\n  &scope=openid%20profile%20email\\\n  &state=xyz123\\\n  &code_challenge=BASE64URL(SHA256(code_verifier))\\\n  &code_challenge_method=S256\n`),
      file(
        "02-callback.ts",
        `// /api/auth/callback/provider\n// 1) Zweryfikuj state.\n// 2) Odbierz ?code=... i wyślij backchannel POST /token.\n`),
      file(
        "03-token-request.http",
        `POST https://idp.example.com/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&\ncode=...&\nredirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fauth%2Fcallback%2Fprovider&\nclient_id=YOUR_CLIENT_ID&\ncode_verifier=YOUR_CODE_VERIFIER\n`),
      file(
        "04-id-token-sample.jwt",
        `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lkcCIsImF1ZCI6ImNsaWVudCIsInN1YiI6InVzZXJfaWQiLCJlbWFpbCI6InVzZXJAZXguY29tIiwiZXhwIjoxNzAwMDAwMDAwfQ.SIGNATURE\n// payload (pretty):\n// {\n//   iss: "https://idp",\n//   aud: "client",\n//   sub: "user_id",\n//   email: "user@ex.com",\n//   exp: 1700000000\n// }\n`),
    ]),
    dir("03-nextauth", [
      file(
        "01-setup.ts",
        `import NextAuth from "next-auth";\nimport Google from "next-auth/providers/google";\nexport const { handlers: { GET, POST } } = NextAuth({\n  secret: process.env.NEXTAUTH_SECRET,\n  providers: [Google({\n    clientId: process.env.AUTH_GOOGLE_ID!,\n    clientSecret: process.env.AUTH_GOOGLE_SECRET!\n  })]\n});\nexport { GET, POST };\n`),
      file(
        "02-env.env",
        `NEXTAUTH_URL=http://localhost:3000\nNEXTAUTH_SECRET=...\nAUTH_GOOGLE_ID=...\nAUTH_GOOGLE_SECRET=...\n`),
    ]),
    dir("04-security", [
      file(
        "01-checklist.md",
        `# Security checklist\n- Używaj HTTPS wszędzie.\n- Waliduj aud/iss/exp w tokenach.\n- Sesja w HttpOnly cookie.\n- Minimalizuj scope'y.\n- Rotuj klucze/sekrety.\n`),
    ]),
    dir("05-troubleshoot", [
      file(
        "01-common.md",
        `# Common issues\n- 400: invalid redirect_uri → sprawdź dokładny URL w IdP.\n- Mismatch state → upewnij się, że przechowujesz state per żądanie.\n- "Cannot GET /api/auth/callback" → brak routa lub zły provider id.\n`),
    ]),
  ]);
}

/** ---------------------- UI ---------------------- */
export default function SSOExplainer() {
  const [root] = useState<DocNode>(buildDocs);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // expand root on mount
  useEffect(() => setExpanded(new Set([root.id])), [root.id]);

  const selectedNode = useMemo(() => findById(root, selectedId), [root, selectedId]);

  return (
    <div className="space-y-4">
      <QuickIntro />

      <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        {/* LEFT: tree */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Btn onClick={() => setExpanded(new Set([root.id]))}>Rozwiń root</Btn>
            <Btn onClick={() => setExpanded(new Set(collectAll(root)))}>Rozwiń wszystko</Btn>
            <Btn onClick={() => setExpanded(new Set())}>Zwiń wszystko</Btn>
          </div>
          <DocTree
            node={root}
            expanded={expanded}
            setExpanded={setExpanded}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* RIGHT: viewer */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3">
          <FileViewer node={selectedNode} />
        </div>
      </div>
    </div>
  );
}

/** ---------------------- Quick Intro ---------------------- */
function QuickIntro() {
  const steps = [
    { n: 1, t: "Przeglądarka → IdP: /authorize (z code_challenge)" },
    { n: 2, t: "IdP → Aplikacja: /callback?code=...&state=..." },
    { n: 3, t: "Aplikacja → IdP: POST /token (code + code_verifier)" },
    { n: 4, t: "Odbierasz access_token (+ id_token); tworzysz sesję" },
    { n: 5, t: "Opcjonalnie: /userinfo z Bearer" },
    { n: 6, t: "Korzystasz z Resource API z Bearer" },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-900/40">
      <div className="font-semibold mb-2">SSO – co tu się dzieje (w skrócie)</div>
      <ol className="list-decimal ml-5 space-y-0.5 text-sm">
        {steps.map(s => (
          <li key={s.n}>{s.t}</li>
        ))}
      </ol>
    </div>
  );
}

/** ---------------------- Tree ---------------------- */
function DocTree({
  node,
  expanded,
  setExpanded,
  selectedId,
  onSelect,
}: {
  node: DocNode;
  expanded: Set<string>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const isDir = node.type === "directory";
  const isOpen = expanded.has(node.id);

  const toggle = () => setExpanded(prev => { const n = new Set(prev); isOpen ? n.delete(node.id) : n.add(node.id); return n; });

  return (
    <div className="leading-6">
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded select-none cursor-pointer ${
          selectedId === node.id ? "bg-blue-100 dark:bg-blue-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        onClick={() => onSelect(node.id)}
      >
        <button className="w-4 text-center" onClick={(e) => { e.stopPropagation(); if (isDir) toggle(); }} title={isDir ? "toggle" : "file"}>
          {isDir ? (isOpen ? "▾" : "▸") : "·"}
        </button>
        <span>{isDir ? "📁" : "📄"}</span>
        <span className="font-medium">{node.name}</span>
      </div>

      {isDir && isOpen && (
        <div className="pl-6 border-l border-gray-200 dark:border-gray-700 ml-2">
          {(node.children ?? []).map((c) => (
            <DocTree
              key={c.id}
              node={c}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** ---------------------- File Viewer ---------------------- */
function FileViewer({ node }: { node: DocNode | null | undefined }) {
  if (!node) return <div className="opacity-70 text-sm">Wybierz plik po lewej, aby zobaczyć treść.</div>;
  if (node.type === "directory") {
    const count = (node.children ?? []).length;
    return (
      <div className="text-sm">
        <div className="font-semibold">{node.name}</div>
        <div className="opacity-70">Folder • {count} elementów</div>
        <p className="mt-2 opacity-80">Wybierz plik w tym folderze, aby wyświetlić treść.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="font-semibold">{node.name}</div>
      <pre className="mt-2 text-xs whitespace-pre-wrap leading-5 max-h-[70vh] overflow-auto p-3 rounded bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800">{node.content}</pre>
    </div>
  );
}

/** ---------------------- Small utils ---------------------- */
function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:shadow active:scale-[0.99]">
      {children}
    </button>
  );
}

function collectAll(n: DocNode): string[] {
  const out: string[] = [];
  const walk = (x: DocNode) => { out.push(x.id); (x.children ?? []).forEach(walk); };
  walk(n);
  return out;
}

function findById(n: DocNode, id: string | null): DocNode | null {
  if (!id) return null;
  if (n.id === id) return n;
  for (const c of n.children ?? []) {
    const r = findById(c, id);
    if (r) return r;
  }
  return null;
}
