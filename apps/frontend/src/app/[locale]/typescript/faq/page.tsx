// app/typescript/faq/page.tsx
import TSFaq from "@/components/TSFaq";

export const metadata = {
  title: "TypeScript FAQ | PytajnikDB",
  description: "Najczęściej zadawane pytania o TypeScript z przykładami.",
};

export default function TypeScriptFAQPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">TypeScript – FAQ</h1>
      <TSFaq />
    </main>
  );
}
