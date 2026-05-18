'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import Icon from './Icon';

type AccessStatus = { active: boolean; email?: string };

export default function TopNav() {
  const pathname = usePathname() || '/';
  const [status, setStatus] = useState<AccessStatus | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/access/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (active) setStatus({ active: !!d?.active, email: d?.email });
      })
      .catch(() => active && setStatus({ active: false }));
    return () => {
      active = false;
    };
  }, []);

  const tabs = [
    { href: '/', label: 'Crear', icon: 'sparkle' as const },
    { href: '/mis-clases', label: 'Mis clases', icon: 'sheet' as const },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await fetch('/api/access/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-30 backdrop-blur-md bg-white/75 border-b border-ink-100 no-print">
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={32} />
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-accent-600 bg-accent-50 border border-accent-200 px-2 py-0.5 rounded-full">
              <Icon name="sparkle" size={10} />
              Beta
            </span>
          </Link>
        </div>

        {status?.active && (
          <div className="flex items-center gap-1 bg-ink-50 border border-ink-100 rounded-xl p-1">
            {tabs.map((tab) => {
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={
                    'inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ' +
                    (active
                      ? 'bg-white text-brand-700 shadow-soft border border-brand-100'
                      : 'text-ink-600 hover:text-ink-900')
                  }
                >
                  <Icon name={tab.icon} size={14} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs font-semibold text-ink-500">
          {status?.active ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-ink-600 hover:text-rose-700 transition-colors"
              title={status.email}
            >
              <span className="hidden sm:inline">Salir</span>
              <span className="sm:hidden">×</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="globe" size={14} />
              <span className="hidden sm:inline">ES · EN</span>
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
