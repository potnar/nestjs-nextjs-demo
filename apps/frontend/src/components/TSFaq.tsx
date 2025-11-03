"use client";

import React, { useMemo, useState } from "react";

/** ---------------------- Types ---------------------- */
type Tag =
  | "Podstawy"
  | "Typy"
  | "Narrowing"
  | "Generyki"
  | "Utility"
  | "Async"
  | "React"
  | "tsconfig"
  | "Narzędzia";

type TSFaqItem = {
  id: string;
  q: string;
  a: string;
  code?: string;
  tags: Tag[];
};

const TAGS: Tag[] = [
  "Podstawy",
  "Typy",
  "Narrowing",
  "Generyki",
  "Utility",
  "Async",
  "React",
  "tsconfig",
  "Narzędzia",
];

/** ---------------------- UI bits (stylistyka jak u Ciebie) ---------------------- */
function TabBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl border ${
        active
          ? "bg-gray-900 text-white dark:bg-white dark:text-black"
          : "bg-gray-100 dark:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3">
      {children}
    </div>
  );
}

function CodeBlock({
  children,
  small,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <pre
      className={`mt-2 ${
        small ? "text-[11px]" : "text-xs"
      } whitespace-pre-wrap leading-5 max-h-[70vh] overflow-auto p-3 rounded bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800`}
    >
      {children}
    </pre>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {}
      }}
      className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs hover:shadow active:scale-[0.99]"
      title="Kopiuj kod"
    >
      {ok ? "Skopiowano" : "Kopiuj"}
    </button>
  );
}

/** ---------------------- FAQ data ---------------------- */
const DATA: TSFaqItem[] = [
  {
    id: "any-vs-unknown",
    q: "Czym różni się `any` od `unknown`?",
    a: "`any` wyłącza sprawdzanie typów (możesz zrobić z wartością wszystko). `unknown` wymaga wcześniejszego zawężenia (type guard) zanim użyjesz wartości. Preferuj `unknown` w wejściach o niepewnym typie.",
    code: `function parseJSON(input: string): unknown {
  return JSON.parse(input);
}

const val = parseJSON('{"a":1}');
// val.a  // BŁĄD – najpierw zawęź:
if (typeof val === "object" && val !== null && "a" in val) {
  // TS wie, że 'a' istnieje
}`,
    tags: ["Podstawy", "Narrowing"],
  },
  {
    id: "never-void",
    q: "Kiedy używać `void`, a kiedy `never`?",
    a: "`void` oznacza, że funkcja nic nie zwraca. `never` – że funkcja nigdy nie kończy (rzuca wyjątek lub nieskończona pętla).",
    code: `function log(msg: string): void {
  console.log(msg);
}
function fail(msg: string): never {
  throw new Error(msg);
}`,
    tags: ["Podstawy"],
  },
  {
    id: "union-intersection",
    q: "Union vs Intersection (`A | B` vs `A & B`)?",
    a: "Union to wartość będąca jednym z typów. Intersection łączy cechy wielu typów (musi spełnić wszystkie).",
    code: `type ApiState = "idle" | "loading" | "error" | "success"; // union
type WithTimestamps = { createdAt: Date } & { updatedAt: Date }; // intersection`,
    tags: ["Typy"],
  },
  {
    id: "keyof-typeof",
    q: "Po co `keyof` i `typeof` w TS?",
    a: "`typeof` pobiera typ zmiennej/obiektu w miejscu użycia. `keyof` tworzy union kluczy typu obiektowego.",
    code: `const STATUS = { idle: 0, loading: 1, error: 2 } as const;
type StatusKey = keyof typeof STATUS; // "idle" | "loading" | "error"`,
    tags: ["Typy"],
  },
  {
    id: "generics-basics",
    q: "Jak działają generyki z ograniczeniami?",
    a: "Użyj `extends`, aby wymusić kształt typu. Dzięki temu TS zna dostępne właściwości.",
    code: `function pluck<T extends object, K extends keyof T>(obj: T, keys: K[]): T[K][] {
  return keys.map(k => obj[k]);
}
const user = { id: 1, name: "Ala", admin: false };
const names = pluck(user, ["name", "admin"]);`,
    tags: ["Generyki"],
  },
  {
    id: "type-guards",
    q: "Jak pisać własne type-guardy (predykaty)?",
    a: "Zwróć predykat `value is X`. TS użyje go do zawężenia w gałęziach `if`.",
    code: `type User = { id: number; name: string };
function isUser(x: unknown): x is User {
  return typeof x === "object" && x !== null && "id" in x && "name" in x;
}
const x: unknown = JSON.parse('{"id":1,"name":"M"}');
if (isUser(x)) {
  x.id; // OK
}`,
    tags: ["Narrowing", "Podstawy"],
  },
  {
    id: "mapped-conditional",
    q: "Czym są mapped i conditional types?",
    a: "Mapped iterują po kluczach (`in`). Conditional wybierają typ zależnie od relacji (`extends`). Razem dają potężne transformacje typów.",
    code: `type ReadonlyKeys<T> = { readonly [K in keyof T]: T[K] };
type NonNullableProps<T> = { [K in keyof T]: NonNullable<T[K]> };

type IdOrName<T> = T extends { id: infer I } ? I : T extends { name: infer N } ? N : never;`,
    tags: ["Typy", "Generyki"],
  },
  {
    id: "utility-types",
    q: "Które Utility Types warto znać?",
    a: "`Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `NonNullable`, `Awaited`. Ułatwiają kompozycję typów.",
    code: `type User = { id: string; name?: string };
type UserUpdate = Partial<User>;
type UserDTO = Omit<User, "id">;
type NameOrId = Pick<User, "id" | "name">;`,
    tags: ["Utility"],
  },
  {
    id: "exact-optional",
    q: "Co robi `exactOptionalPropertyTypes`?",
    a: "Rozróżnia `prop?: T` od `prop: T | undefined`. Z włączoną opcją puste obiekty nie spełnią typów z opcjonalnymi właściwościami, jeśli ich nie podasz explicite.",
    code: `// tsconfig.json -> "exactOptionalPropertyTypes": true`,
    tags: ["tsconfig"],
  },
  {
    id: "strict-null",
    q: "Dlaczego `strict` i `strictNullChecks` są ważne?",
    a: "Włączają rygorystyczne sprawdzanie (mniej błędów runtime). `strictNullChecks` wymusza obsługę `null/undefined` tam, gdzie mogą się pojawić.",
    code: `// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}`,
    tags: ["tsconfig"],
  },
  {
    id: "async-awaited",
    q: "Jak typować `async/await` i `Promise`?",
    a: "Zwracaj precyzyjne typy. `Awaited<T>` wyciąga typ z Promisa. Funkcje `async` zwracają `Promise<ReturnType>`.",
    code: `async function getUser(id: string) {
  return { id, name: "Ala" };
}
type User = Awaited<ReturnType<typeof getUser>>;`,
    tags: ["Async", "Utility"],
  },
  {
    id: "function-overloads",
    q: "Kiedy używać przeciążeń (overloads)?",
    a: "Gdy jedna implementacja obsługuje różne zestawy argumentów i chcesz precyzyjnych typów zwrotnych per wariant.",
    code: `function parse(input: string): number;
function parse(input: number): string;
function parse(input: string | number) {
  return typeof input === "string" ? Number(input) : String(input);
}
const a = parse("42"); // number
const b = parse(42);   // string`,
    tags: ["Typy", "Podstawy"],
  },
  {
    id: "discriminated-union",
    q: "Jak modelować stany maszyną: Discriminated Union?",
    a: "Dodaj pole rozróżniające (`type`) i zawężaj w `switch`.",
    code: `type State =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; error: string }
  | { type: "success"; data: string };

function view(s: State) {
  switch (s.type) {
    case "error": return s.error;
    case "success": return s.data;
    default: return "";
  }
}`,
    tags: ["Typy", "Narrowing"],
  },
  {
    id: "react-props",
    q: "Jak typować `children` i propsy HTML w React?",
    a: "Użyj `React.ReactNode` dla `children` i `React.ComponentProps<'button'>` dla delegowania propsów natywnych.",
    code: `type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "primary" | "ghost";
  children: React.ReactNode;
};
function Button({ variant = "primary", ...rest }: ButtonProps) {
  return <button {...rest} />;
}`,
    tags: ["React"],
  },
  {
    id: "react-events-refs",
    q: "Typy dla eventów i `useRef`?",
    a: "`React.ChangeEvent<HTMLInputElement>` dla inputa. `useRef<HTMLInputElement | null>(null)` dla refa do inputa.",
    code: `const [val, setVal] = useState("");
function onChange(e: React.ChangeEvent<HTMLInputElement>) {
  setVal(e.target.value);
}
const ref = React.useRef<HTMLInputElement | null>(null);`,
    tags: ["React"],
  },
  {
    id: "satisfies-as-const",
    q: "`satisfies` i `as const` – po co?",
    a: "`as const` zamraża literały (readonly, wąskie typy). `satisfies` sprawdza zgodność bez utraty inferowanych literałów.",
    code: `const routes = {
  home: "/",
  user: "/user/:id",
} as const;

type RouteKey = keyof typeof routes; // "home" | "user"

const config = {
  env: "prod",
  features: ["auth", "search"],
} satisfies { env: "dev" | "prod"; features: readonly string[] };`,
    tags: ["Typy", "Podstawy"],
  },
  {
    id: "module-resolution",
    q: "Jakie `moduleResolution` w nowoczesnych bundlerach?",
    a: "Dla Next.js/modern toolchain: `moduleResolution: \"bundler\"`, `module: \"esnext\"`, `moduleDetection: \"force\"`. Ułatwia ESM i typy dla `exports`.",
    code: `// tsconfig.json (Next.js 15 zwykle nadpisuje część opcji)
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "target": "ES2022",
    "jsx": "preserve",
    "isolatedModules": true
  }
}`,
    tags: ["tsconfig"],
  },
  {
    id: "zod-infer",
    q: "Jak powiązać walidację runtime (Zod) z typami?",
    a: "Waliduj danymi Zoda i wyciągnij typ przez `z.infer`. Masz jeden kontrakt w runtime i w typach.",
    code: `import { z } from "zod";
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;

function handle(input: unknown): User {
  return UserSchema.parse(input);
}`,
    tags: ["Narzędzia", "Typy"],
  },
];

/** ---------------------- Component ---------------------- */
export default function TSFaq() {
  const [active, setActive] = useState<Tag | "Wszystko">("Wszystko");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DATA.filter((item) => {
      const byTag = active === "Wszystko" ? true : item.tags.includes(active);
      const byText =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        (item.code?.toLowerCase().includes(q) ?? false);
      return byTag && byText;
    });
  }, [active, query]);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabBtn active={active === "Wszystko"} onClick={() => setActive("Wszystko")}>
          Wszystko
        </TabBtn>
        {TAGS.map((t) => (
          <TabBtn key={t} active={active === t} onClick={() => setActive(t)}>
            {t}
          </TabBtn>
        ))}
      </div>

      {/* Search */}
      <Card>
        <div className="flex gap-2 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj w pytaniach, odpowiedziach i kodzie..."
            className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none"
          />
          <span className="text-xs opacity-70 whitespace-nowrap">
            {filtered.length} wyników
          </span>
        </div>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <FaqRow key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <Card>
            <div className="text-sm opacity-70">Brak wyników dla tego filtra.</div>
          </Card>
        )}
      </div>

      {/* Notes */}
      <Card>
        <div className="text-xs">
          <div className="font-semibold mb-1">Tipy:</div>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              Włącz <code>strict</code>, <code>noImplicitAny</code>,{" "}
              <code>strictNullChecks</code>, <code>exactOptionalPropertyTypes</code>.
            </li>
            <li>
              Zamiast <code>any</code> używaj <code>unknown</code> + type-guardy.
            </li>
            <li>Modeluj stany przez Discriminated Union.</li>
            <li>
              W React typuj eventy i refy (np.{" "}
              <code>React.ChangeEvent&lt;HTMLInputElement&gt;</code>,
              <code>useRef&lt;HTMLDivElement | null&gt;</code>).
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

function FaqRow({ item }: { item: TSFaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        className={`w-full flex items-start justify-between gap-3 text-left px-2 py-1 rounded ${
          open
            ? "bg-blue-100 dark:bg-blue-900/30"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <div className="font-medium">{item.q}</div>
          <div className="mt-1 text-xs opacity-70">
            {item.tags.map((t) => (
              <span
                key={t}
                className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 select-none">{open ? "▾" : "▸"}</div>
      </button>

      {open && (
        <div className="mt-2 px-2">
          <div className="text-sm">{item.a}</div>
          {item.code && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs opacity-70">Przykład</span>
              <CopyBtn text={item.code} />
            </div>
          )}
          {item.code && <CodeBlock>{item.code}</CodeBlock>}
        </div>
      )}
    </Card>
  );
}
