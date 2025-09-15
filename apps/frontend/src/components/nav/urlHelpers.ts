// src/components/nav/urlHelpers.ts
export function stripLocale(path: string) {
  // usuń wiodący /pl lub /en
  const result = path.replace(/^\/(pl|en)(?=\/|$)/, '');
  return result === '' ? '/' : result;
}

export function withLocalePrefix(path: string, locale: 'pl' | 'en') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  // na wszelki wypadek zdejmij ewentualny prefiks
  const base = clean.replace(/^\/(pl|en)(?=\/|$)/, '');
  return base === '/' ? `/${locale}` : `/${locale}${base}`;
}
