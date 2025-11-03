"use client";
// src/app/[locale]/interview-prep/login-sso/page.tsx
import LiveSSOLoginFlow from "@/components/LiveSSOLoginFlow";
// import SSOExplainer from "@/components/sso/SSOExplainer";
import SSOReadyConfigs from "@/components/SSOReadyConfigs";
import { useState } from "react";

export default function Page() {
  const [tab, setTab] = useState<"explainer" | "configs">("explainer");

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">SSO – Explainer & Configs</h1>

      <div className="flex gap-2">
        <TabBtn active={tab === "explainer"} onClick={() => setTab("explainer")}>
          📘 Objaśnienie
        </TabBtn>
        <TabBtn active={tab === "configs"} onClick={() => setTab("configs")}>
          ⚙️ Gotowe konfiguracje
        </TabBtn>
      </div>

      {tab === "explainer" ? <LiveSSOLoginFlow /> : <SSOReadyConfigs />}
    </main>
  );
}

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
