"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type NodeType = "file" | "directory";
export type NodeT = { id: string; name: string; type: NodeType; children?: NodeT[] };
export type Mode = "preorder" | "postorder" | "bfs";

type Labels = {
  newTree: string; expandRoot: string; expandAll: string; collapseAll: string;
  traversalMode: string; preorder: string; postorder: string; bfs: string;
  start: string; pause: string; step: string; reset: string;
  whatIsHappening: string; callStack: string; structure: string; dirs: string; files: string;
};

// ---------- traversals (hoisted outside component) ----------
type Step = {
  kind: "enter" | "leave" | "visit";
  nodeId: string;
  stack: string[];
  note: string;
};

function* preorder(r: NodeT): Generator<Step> {
  const stack: string[] = [];
  function* walk(n: NodeT): Generator<Step> {
    if (n.type === "directory") {
      stack.push(n.name);
      yield { kind: "enter", nodeId: n.id, stack: [...stack], note: `ENTER: ${n.name}` };
      for (const c of n.children ?? []) yield* walk(c);
      yield { kind: "leave", nodeId: n.id, stack: [...stack], note: `LEAVE: ${n.name}` };
      stack.pop();
    } else {
      yield { kind: "visit", nodeId: n.id, stack: [...stack], note: `VISIT: ${n.name}` };
    }
  }
  yield* walk(r);
}

// Na razie ta sama implementacja (UI może tłumaczyć różnicę)
const postorder = preorder;

function* bfs(r: NodeT): Generator<Step> {
  const q: NodeT[] = [r];
  while (q.length) {
    const n = q.shift()!;
    if (n.type === "directory") {
      yield { kind: "enter", nodeId: n.id, stack: [], note: `QUEUE ${n.name}` };
      (n.children ?? []).forEach((c) => q.push(c));
      yield { kind: "leave", nodeId: n.id, stack: [], note: `DEQUEUE ${n.name}` };
    } else {
      yield { kind: "visit", nodeId: n.id, stack: [], note: `DEQUEUE ${n.name}` };
    }
  }
}

export default function LiveNestingBuilder({ labels }: { labels: Labels }) {
  // ---------- helpers ----------
  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  const collectAll = (n: NodeT): string[] => {
    const out: string[] = [];
    const walk = (x: NodeT) => { out.push(x.id); (x.children ?? []).forEach(walk); };
    walk(n);
    return out;
  };

  // ---------- tree state ----------
  const [root, setRoot] = useState<NodeT>({ id: newId(), name: "project", type: "directory", children: [] });
  const [expanded, setExpanded] = useState<Set<string>>(new Set([]));

  // expand root on mount & when root changes
  useEffect(() => {
    setExpanded(new Set([root.id]));
  }, [root.id]);

  // ---------- edit ops ----------
  const addChild = (tree: NodeT, targetId: string, child: NodeT): NodeT => {
    const t = clone(tree);
    const visit = (n: NodeT): boolean => {
      if (n.id === targetId && n.type === "directory") {
        n.children = n.children ?? [];
        n.children.push(child);
        return true;
      }
      return (n.children ?? []).some(visit);
    };
    visit(t);
    return t;
  };

  const removeNode = (tree: NodeT, targetId: string): NodeT => {
    const t = clone(tree);
    const visit = (n: NodeT): boolean => {
      if (!n.children) return false;
      const i = n.children.findIndex(c => c.id === targetId);
      if (i !== -1) { n.children.splice(i, 1); return true; }
      return n.children.some(visit);
    };
    if (t.id !== targetId) visit(t);
    return t;
  };

  const renameNode = (tree: NodeT, targetId: string, name: string): NodeT => {
    const t = clone(tree);
    const visit = (n: NodeT): boolean => {
      if (n.id === targetId) { n.name = name; return true; }
      return (n.children ?? []).some(visit);
    };
    visit(t);
    return t;
  };

  const moveNode = (tree: NodeT, targetId: string, dir: -1 | 1): NodeT => {
    const t = clone(tree);
    const visit = (n: NodeT): boolean => {
      if (!n.children) return false;
      const i = n.children.findIndex(c => c.id === targetId);
      if (i !== -1) {
        const j = i + dir;
        if (j < 0 || j >= n.children.length) return true;
        const [el] = n.children.splice(i, 1);
        n.children.splice(j, 0, el);
        return true;
      }
      return n.children.some(visit);
    };
    visit(t);
    return t;
  };

  // ---------- traversal + trace (użycie) ----------
  const [mode, setMode] = useState<Mode>("preorder");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState<Step | null>(null);
  const iterRef = useRef<Generator<Step, void, unknown> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTrace = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setCurrent(null);
    iterRef.current = null;
  }, []);

  const buildIter = useCallback(() => {
    switch (mode) {
      case "preorder": return preorder(root);
      case "postorder": return postorder(root);
      case "bfs": return bfs(root);
    }
  }, [root, mode]);

  const stepOnce = useCallback(() => {
    if (!iterRef.current) iterRef.current = buildIter()!;
    const r = iterRef.current.next();
    if (!r.done) {
      setCurrent(r.value);
      // auto expand directory we step into
      if (r.value.kind !== "visit") {
        setExpanded(prev => new Set([...prev, r.value.nodeId]));
      }
    } else {
      setPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [buildIter]);

  const playPause = useCallback(() => {
    if (playing) {
      setPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setPlaying(true);
      if (!iterRef.current) iterRef.current = buildIter()!;
      timerRef.current = setInterval(() => stepOnce(), 700);
    }
  }, [playing, buildIter, stepOnce]);

  // ---------- stats ----------
  const stats = useMemo(() => {
    let files = 0, dirs = 0;
    const walk = (n: NodeT) => {
      if (n.type === "directory") { dirs++; (n.children ?? []).forEach(walk); }
      else files++;
    };
    walk(root);
    return { files, dirs };
  }, [root]);

  // ---------- UI ----------
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => {
          setRoot({ id: newId(), name: "project", type: "directory", children: [] });
          resetTrace();
          setExpanded(new Set()); // useEffect z [root.id] rozwinie root po zmianie
        }}>
          {labels.newTree}
        </Btn>
        <Btn onClick={() => setExpanded(new Set([root.id]))}>{labels.expandRoot}</Btn>
        <Btn onClick={() => setExpanded(new Set(collectAll(root)))}>{labels.expandAll}</Btn>
        <Btn onClick={() => setExpanded(new Set())}>{labels.collapseAll}</Btn>
      </div>

      <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3">
          <TreeNode
            node={root}
            expanded={expanded}
            setExpanded={setExpanded}
            onAddChild={(parent, type) => {
              resetTrace();
              const name = type === "directory" ? "folder" : "file";
              setRoot(r => addChild(r, parent, {
                id: newId(),
                name: `${name}-${Math.floor(Math.random() * 100)}`,
                type,
                children: type === "directory" ? [] : undefined
              }));
              setExpanded(prev => new Set([...prev, parent]));
            }}
            onRemove={(id) => { resetTrace(); setRoot(r => removeNode(r, id)); }}
            onRename={(id, n) => { resetTrace(); setRoot(r => renameNode(r, id, n)); }}
            onMove={(id, dir) => { resetTrace(); setRoot(r => moveNode(r, id, dir)); }}
            highlightId={current?.nodeId ?? null}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3 space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">{labels.traversalMode}</label>
            <select
              className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800"
              value={mode}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setMode(e.target.value as Mode);
                resetTrace();
              }}
            >
              <option value="preorder">{labels.preorder}</option>
              <option value="postorder">{labels.postorder}</option>
              <option value="bfs">{labels.bfs}</option>
            </select>
            <Btn onClick={playPause}>{playing ? labels.pause : labels.start}</Btn>
            <Btn onClick={stepOnce}>{labels.step}</Btn>
            <Btn onClick={resetTrace}>{labels.reset}</Btn>
          </div>

          <div className="text-sm">
            <h3 className="font-semibold mb-1">{labels.whatIsHappening}</h3>
            {current ? (
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                <div>
                  <span className="font-mono px-1 rounded bg-yellow-100 dark:bg-yellow-900/40 mr-2">{current.kind}</span>
                  {current.note}
                </div>
                <div className="mt-2 opacity-80">
                  {labels.callStack}: {current.stack.length ? current.stack.join(" › ") : "(empty)"}
                </div>
              </div>
            ) : (
              <div className="opacity-70">Start/Step to trace…</div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-1">{labels.structure}</h3>
            <pre className="text-xs whitespace-pre-wrap max-h-72 overflow-auto">{JSON.stringify(root, null, 2)}</pre>
            <div className="mt-2 text-sm opacity-80">📁 {labels.dirs}: {stats.dirs} • 📄 {labels.files}: {stats.files}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------- Presentational subcomponents -------
function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:shadow active:scale-[0.99]">
      {children}
    </button>
  );
}

function NameInlineEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <span>
      {editing ? (
        <input
          className="px-1 rounded bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => { setEditing(false); onChange(text.trim() || value); }}
          onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onChange(text.trim() || value); } }}
          autoFocus
        />
      ) : (
        <span className="underline decoration-dotted cursor-text" onClick={() => setEditing(true)}>
          {value}
        </span>
      )}
    </span>
  );
}

function TreeNode({
  node, expanded, setExpanded,
  onAddChild, onRemove, onRename, onMove, highlightId
}: {
  node: NodeT;
  expanded: Set<string>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
  onAddChild: (parentId: string, type: NodeType) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  highlightId?: string | null;
}) {
  const isDir = node.type === "directory";
  const isOpen = expanded.has(node.id);

  const toggle = () => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (isOpen) {
        n.delete(node.id);
      } else {
        n.add(node.id);
      }
      return n;
    });
  };

  return (
    <div className="leading-6">
      <div className={`flex items-center gap-2 px-2 py-1 rounded select-none ${highlightId === node.id ? "bg-yellow-100 dark:bg-yellow-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
        <button className="w-4 text-center" onClick={isDir ? toggle : undefined} title={isDir ? "toggle" : "file"}>
          {isDir ? (isOpen ? "▾" : "▸") : "·"}
        </button>
        <span>{isDir ? "📁" : "📄"}</span>
        <NameInlineEditor value={node.name} onChange={(v) => onRename(node.id, v)} />
        <span className="ml-auto flex gap-1 text-xs">
          {isDir && (
            <>
              <Btn onClick={() => onAddChild(node.id, "directory")}>+ dir</Btn>
              <Btn onClick={() => onAddChild(node.id, "file")}>+ file</Btn>
            </>
          )}
          <Btn onClick={() => onMove(node.id, -1)}>↑</Btn>
          <Btn onClick={() => onMove(node.id, 1)}>↓</Btn>
          <Btn onClick={() => onRemove(node.id)}>🗑</Btn>
        </span>
      </div>

      {isDir && isOpen && (
        <div className="pl-6 border-l border-gray-200 dark:border-gray-700 ml-2">
          {(node.children ?? []).map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              expanded={expanded}
              setExpanded={setExpanded}
              onAddChild={onAddChild}
              onRemove={onRemove}
              onRename={onRename}
              onMove={onMove}
              highlightId={highlightId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
