'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Scout' },
  { href: '/library', label: 'Library' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight text-sm">
          TEDAR
          <span className="ml-2 font-normal text-xs text-gray-400 hidden sm:inline">
            content intelligence for creators
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? 'text-violet-700 font-medium'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
