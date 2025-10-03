import { ReactNode, AnchorHTMLAttributes } from 'react';
import { renderWithIntl } from '@/test/renderWithIntl';
import HomePage from '@/app/[locale]/page';

// ✅ jeden mock zamiast dwóch
jest.mock('next-intl/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: { href: string | { pathname: string }; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : '/'} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  redirect: () => {},
  getPathname: () => '/',
}));

describe('HomePage', () => {
  it('renders EN translation', () => {
    const { getByRole } = renderWithIntl(<HomePage />, 'en');
    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Version 0.2');
  });

  it('renders PL translation', () => {
    const { getByRole } = renderWithIntl(<HomePage />, 'pl');
    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Wersja 0.2');
  });
});
