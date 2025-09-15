import '@testing-library/jest-dom';

// ---- MOCK next-intl (provider + hooks) ----
jest.mock('next-intl', () => {
  const React = require('react');
  const Ctx = React.createContext({ locale: 'en', messages: {} as any });

  const NextIntlClientProvider = ({ locale, messages, children }: any) =>
    React.createElement(Ctx.Provider, { value: { locale, messages } }, children);

  const useLocale = () => {
    const { locale } = React.useContext(Ctx);
    return locale as 'en' | 'pl';
  };

  const useTranslations = (ns?: string) => {
    const { messages } = React.useContext(Ctx);
    return (key: string, vars?: Record<string, any>) => {
      const full = ns ? `${ns}.${key}` : key;
      const val = full.split('.').reduce((acc: any, k) => acc?.[k], messages);
      return typeof val === 'string'
        ? val.replace(/\{(\w+)\}/g, (_: any, m: string) => String(vars?.[m] ?? ''))
        : full;
    };
  };

  const useFormatter = () => ({});
  return { NextIntlClientProvider, useLocale, useTranslations, useFormatter };
});

// ---- MOCK *lokalnego* modułu: "@/i18n/navigation" ----
// (to TEN import powodował zaciągnięcie `next-intl/routing` ESM)
jest.mock('@/i18n/navigation', () => {
  const React = require('react');
  const Link = ({ href, children, ...rest }: any) =>
    React.createElement('a', { href: typeof href === 'string' ? href : '/', ...rest }, children);
  const usePathname = () => '/';
  const useRouter = () => ({ push: jest.fn(), replace: jest.fn() });
  const redirect = () => {};
  const getPathname = () => '/';
  return { Link, usePathname, useRouter, redirect, getPathname };
});
