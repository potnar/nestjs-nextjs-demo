import React from 'react';
import {render} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import en from '@/languages/en.json';
import pl from '@/languages/pl.json';

export function renderWithIntl(
  ui: React.ReactElement,
  locale: 'en' | 'pl' = 'en'
) {
  const messages = locale === 'en' ? en : pl;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}
