"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * SSOReadyConfigs – interaktywna struktura folderów z gotowymi konfiguracjami SSO
 *
 * Dwa warianty do przełączania w zakładkach:
 * 1) Next.js 15 (App Router) + NextAuth v5 → Google + Facebook
 * 2) React SPA → Firebase Authentication (Google + Facebook)
 *
 * UI: lewy panel = drzewo projektu; prawy panel = zawartość klikniętego pliku.
 * Wszystko w jednym lekkim komponencie (React + Tailwind).
 */

/** ---------------------- Types ---------------------- */
export type DocNode = {
  id: string;
  name: string;
  type: "directory" | "file";
  children?: DocNode[];
  content?: string; // dla plików
};

/** ---------------------- Helpers ---------------------- */
const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const dir = (name: string, children: DocNode[] = []): DocNode => ({ id: newId(), name, type: "directory", children });
const file = (name: string, content: string): DocNode => ({ id: newId(), name, type: "file", content });
const collectAll = (n: DocNode): string[] => { const out: string[] = []; const walk = (x: DocNode) => { out.push(x.id); (x.children ?? []).forEach(walk); }; walk(n); return out; };
const findById = (n: DocNode, id: string | null): DocNode | null => { if (!id) return null; if (n.id === id) return n; for (const c of n.children ?? []) { const r = findById(c, id); if (r) return r; } return null; };

/** ---------------------- Trees (project templates) ---------------------- */
function buildNextAuthTree(): DocNode {
  return dir("nextauth-project", [
    file(
      ".env.local",
      `NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=REPLACE_ME # npx auth secret

AUTH_GOOGLE_ID=YOUR_GOOGLE_CLIENT_ID
AUTH_GOOGLE_SECRET=YOUR_GOOGLE_CLIENT_SECRET

AUTH_FACEBOOK_ID=YOUR_FACEBOOK_APP_ID
AUTH_FACEBOOK_SECRET=YOUR_FACEBOOK_APP_SECRET
`
    ),
    dir("src", [
      dir("app", [
        dir("api", [
          dir("auth", [
            dir("[...nextauth]", [
              file(
                "route.ts",
                `import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
  ],
});

export { GET, POST };
`
              ),
            ]),
          ]),
        ]),
        file(
          "page.tsx",
          `// Server Component – podgląd sesji
import { auth } from "./api/auth/[...nextauth]/route";
import SignButtons from "../components/SignButtons";

export default async function Page() {
  const session = await auth();
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      {session ? (
        <>
          <div className="text-sm">Signed in as: <b>{session.user?.email}</b></div>
          <SignButtons mode="out" />
        </>
      ) : (
        <SignButtons mode="in" />
      )}
    </main>
  );
}
`
        ),
      ]),
      dir("components", [
        file(
          "SignButtons.tsx",
          `"use client";
import { signIn, signOut } from "../app/api/auth/[...nextauth]/route";
export default function SignButtons({ mode }: { mode: "in" | "out" }) {
  if (mode === "out") {
    return (
      <button onClick={() => signOut()} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800">Sign out</button>
    );
  }
  return (
    <div className="flex gap-2">
      <button onClick={() => signIn("google")} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800">Sign in with Google</button>
      <button onClick={() => signIn("facebook")} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800">Sign in with Facebook</button>
    </div>
  );
}
`
        ),
      ]),
    ]),
    file(
      "README.md",
      `# NextAuth v5 (Next.js 15) – Google + Facebook
1) Zainstaluj: \`pnpm add next-auth\`
2) Ustaw .env.local (sekrety + NEXTAUTH_URL).
3) Dodaj redirecty u dostawców:
   - http://localhost:3000/api/auth/callback/google
   - http://localhost:3000/api/auth/callback/facebook
4) Odpal dev: \`pnpm dev\`.
`
    ),
  ]);
}

function buildFirebaseTree(): DocNode {
  return dir("react-firebase-project", [
    file(
      ".env.local",
      `NEXT_PUBLIC_FB_API_KEY=...
NEXT_PUBLIC_FB_AUTH_DOMAIN=...
NEXT_PUBLIC_FB_PROJECT_ID=...
NEXT_PUBLIC_FB_APP_ID=...
`
    ),
    dir("src", [
      file(
        "firebase.ts",
        `import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export async function loginGoogle() { return signInWithPopup(auth, googleProvider); }
export async function loginFacebook() { return signInWithPopup(auth, facebookProvider); }
export async function logout() { return signOut(auth); }
`
      ),
      dir("app", [
        file(
          "page.tsx",
          `"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, loginGoogle, loginFacebook, logout } from "../firebase";

export default function FirebaseAuthDemo() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Firebase Auth (Google/Facebook)</h1>
      {user ? (
        <>
          <div className="text-sm">Signed in as: <b>{user.email}</b></div>
          <button onClick={logout} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800">Sign out</button>
        </>
      ) : (
        <div className="flex gap-2">
          <button onClick={loginGoogle} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800">Sign in with Google</button>
          <button onClick={loginFacebook} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800">Sign in with Facebook</button>
        </div>
      )}
    </div>
  );
}
`
        ),
      ]),
    ]),
    file(
      "README.md",
      `# React SPA – Firebase Auth (Google + Facebook)
1) Zainstaluj: \`pnpm add firebase\`
2) Skonfiguruj providerów w konsoli Firebase + Facebook (redirecty).
3) Uzupełnij .env.local (NEXT_PUBLIC_*).
`
    ),
  ]);
}

/** ---------------------- Component ---------------------- */
export default function SSOReadyConfigs() {
  const [stack, setStack] = useState<"nextauth" | "firebase">("nextauth");
  const [nextRoot] = useState<DocNode>(buildNextAuthTree);
  const [fbRoot] = useState<DocNode>(buildFirebaseTree);

  const root = stack === "nextauth" ? nextRoot : fbRoot;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => { setExpanded(new Set([root.id])); setSelectedId(null); }, [root.id]);

  const selectedNode = useMemo(() => findById(root, selectedId), [root, selectedId]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <TabBtn active={stack === "nextauth"} onClick={() => setStack("nextauth")}>
          Next.js 15 + NextAuth v5
        </TabBtn>
        <TabBtn active={stack === "firebase"} onClick={() => setStack("firebase")}>
          React SPA + Firebase Auth
        </TabBtn>
      </div>

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

        {/* RIGHT: file viewer */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3">
          <FileViewer node={selectedNode} />
        </div>
      </div>

      <Notes stack={stack} />
    </div>
  );
}

/** ---------------------- UI bits ---------------------- */
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
 
  const toggle = () =>
    setExpanded(prev => {
      const n = new Set(prev);
      if (isOpen) {
        n.delete(node.id);
      } else {
        n.add(node.id);
      }
      return n;
    });

  return (
    <div className="leading-6">
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded select-none cursor-pointer ${
          selectedId === node.id ? "bg-blue-100 dark:bg-blue-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        onClick={() => onSelect(node.id)}
      >
        <button type="button" className="w-4 text-center" onClick={(e) => { e.stopPropagation(); if (isDir) toggle(); }} title={isDir ? "toggle" : "file"}>
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

function FileViewer({ node }: { node: DocNode | null }) {
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

function TabBtn({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode; }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-xl border ${active ? "bg-gray-900 text-white dark:bg-white dark:text-black" : "bg-gray-100 dark:bg-gray-800"}`}>
      {children}
    </button>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:shadow active:scale-[0.99]">
      {children}
    </button>
  );
}

function Notes({ stack }: { stack: "nextauth" | "firebase" }) {
  if (stack === "nextauth") {
    return (
      <div className="text-xs p-3 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
        <div className="font-semibold mb-1">Uwagi (NextAuth):</div>
        <ul className="list-disc ml-5 space-y-1">
          <li>Upewnij się, że <code>NEXTAUTH_URL</code> odpowiada środowisku (dev/prod) i masz ustawione <code>NEXTAUTH_SECRET</code>.</li>
          <li>Dodaj poprawne Redirect URIs u dostawców (Google/Facebook) – zarówno dev, jak i produkcyjne domeny.</li>
          <li>W produkcji korzystaj z HTTPS i bezpiecznych ciasteczek (HttpOnly, Secure, SameSite odpowiednio do domen).</li>
        </ul>
      </div>
    );
  }
  return (
    <div className="text-xs p-3 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
      <div className="font-semibold mb-1">Uwagi (Firebase SPA):</div>
      <ul className="list-disc ml-5 space-y-1">
        <li>Włącz providerów w konsoli Firebase (Google, Facebook) i dodaj domeny autoryzowane.</li>
        <li>W aplikacji Facebook dodaj poprawny redirect (Firebase pokaże właściwy URL).</li>
        <li>Tokeny są po stronie klienta – uważaj na dostęp do wrażliwych API (CORS, reguły, itd.).</li>
      </ul>
    </div>
  );
}
