'use client';

import Header from '@/components/Header';
import OKRTree from '@/components/OKRTree';
import { useUser } from '@/context/UserContext';

export default function Home() {
  const { loading } = useUser();

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <OKRTree />
    </main>
  );
}
