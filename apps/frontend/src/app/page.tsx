'use client';

import Link from 'next/link';
import { tiles } from '@/data/tiles';

export default function HomePage() {
  return (
    <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {tiles.map(({ href, title, description }) => (
        <Link
          key={href}
          href={href}
          className="p-6 rounded-xl shadow-lg border hover:bg-gray-100 transition"
        >
          <h2 className="text-lg font-bold mb-2">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </Link>
      ))}
    </div>
  );
}
