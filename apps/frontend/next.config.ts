import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// W monorepo wskaż ścieżkę względem pliku next.config.ts
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// (opcjonalnie) łatwe przełączenie hosta API między env-ami
const API_HOST = process.env.API_HOST ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_HOST}/api/:path*`, // proxy do backendu
      },
    ];
  },
};

export default withNextIntl(nextConfig);
