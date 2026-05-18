'use client';

import TopNav from '@/components/TopNav';
import PaywallGate from '@/components/PaywallGate';
import LibraryView from '@/components/library/LibraryView';

const MP_SUBSCRIPTION_URL = process.env.NEXT_PUBLIC_MP_SUBSCRIPTION_URL || '#';

export default function MisClasesPage() {
  return (
    <div className="min-h-screen bg-hero">
      <TopNav />
      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-7xl">
        <header className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 leading-tight">
            Mis clases
          </h1>
          <p className="mt-2 text-base text-ink-600 max-w-2xl">
            Tu biblioteca docente. Organiza por grupo, materia o tema, duplica clases para
            adaptarlas, marca favoritos y vuelve cuando quieras.
          </p>
        </header>
        <PaywallGate subscriptionUrl={MP_SUBSCRIPTION_URL}>
          <LibraryView />
        </PaywallGate>
      </main>
    </div>
  );
}
