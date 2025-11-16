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
  async headers() {
    return [
      {
        source: "/:path*",   // wszystkie ścieżki
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
