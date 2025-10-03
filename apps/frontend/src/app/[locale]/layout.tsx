import Navbar from "@/components/nav/Navbar";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";

type Locale = "pl" | "en";
type Messages = Record<string, string>;

type Props = {
  children: ReactNode;
  params: { locale: Locale };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;
  setRequestLocale(locale);

  const messages: Messages = (await import(`@/languages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <Navbar />
      <main>{children}</main>
    </NextIntlClientProvider>
  );
}
