import { NextIntlClientProvider } from "next-intl";
import Navbar from "@/components/nav/Navbar";
import { setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: { locale: "pl" | "en" };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;
  setRequestLocale(locale);

  // 🟢 Zamiast `as any` użyjemy bezpiecznego typu dla JSON-a:
  const messages = (await import(`@/languages/${locale}.json`))
    .default as Record<string, string>;

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <Navbar />
      <main>{children}</main>
    </NextIntlClientProvider>
  );
}
