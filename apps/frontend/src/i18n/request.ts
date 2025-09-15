import {getRequestConfig} from "next-intl/server";
import {defineRouting} from "next-intl/routing";

const routing = defineRouting({
  locales: ["pl", "en"],
  defaultLocale: "pl",
  localePrefix: "as-needed"
});

export default getRequestConfig(async ({locale}) => {
  const lang = routing.locales.includes(locale as any) ? (locale as "pl" | "en") : routing.defaultLocale;
  return {
    locale: lang,
    messages: (await import(`../languages/${lang}.json`)).default
  };
});
