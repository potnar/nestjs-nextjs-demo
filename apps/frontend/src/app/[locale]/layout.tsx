import Navbar from "@/components/nav/Navbar";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";

type Locale = "pl" | "en";

type Props = {
  children: ReactNode;
  // zgodnie z Twoim LayoutProps -> params jako Promise
  params: Promise<{ locale: Locale }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params; // <-- zgodne z LayoutProps
  setRequestLocale(locale);

  const messages = (await import(`@/languages/${locale}.json`))
    .default as AbstractIntlMessages;

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <Navbar />
      <main>{children}</main>
    </NextIntlClientProvider>
  );
}
