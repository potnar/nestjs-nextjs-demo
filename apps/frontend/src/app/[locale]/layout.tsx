import { NextIntlClientProvider} from "next-intl";
import Navbar from "@/components/nav/Navbar";
import {  setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";
import {createTranslator} from "next-intl"; 

type Props = {
  children: ReactNode;
  params: Promise<{ locale: "pl" | "en" }>;
};

export default async function LocaleLayout({children, params}: Props) {
  // ⬅️ KLUCZOWE: najpierw await na params
  const {locale} = await params;

  

  // ⬅️ Ustaw locale przed pobraniem messages
  setRequestLocale(locale);
  // const messages = await getMessages();
 

  const messages = (await import(`@/languages/${locale}.json`)).default as any;
  const t = await createTranslator({locale, messages});

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <Navbar />
      <main>{children}</main>
    </NextIntlClientProvider>
  );
}
