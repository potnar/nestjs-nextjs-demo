import {getRequestConfig} from "next-intl/server";
import {defineRouting} from "next-intl/routing";

const routing = defineRouting({
  locales: ["pl", "en"] as const,
  defaultLocale: "pl",
  localePrefix: "as-needed"
});

type Locale = typeof routing.locales[number];
type Messages = Record<string, string>;

function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (routing.locales as readonly string[]).includes(x);
}

export default getRequestConfig(async ({locale}) => {
  // locale może być undefined -> zrób fallback
  const loc = typeof locale === "string" ? locale : routing.defaultLocale;
  const lang: Locale = isLocale(loc) ? loc : routing.defaultLocale;

  const mod = await import(`../languages/${lang}.json`);
  const messages = mod.default as Messages;

  return {
    locale: lang,
    messages
  };
});
