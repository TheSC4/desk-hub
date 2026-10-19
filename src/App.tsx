import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Revise from './pages/Revise';
import { seedDatabase } from './db/seed';
import { useWakeLock } from './hooks/useWakeLock';

export type Tab = 'dashboard' | 'revise';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [ready, setReady] = useState(false);

  useWakeLock();

  useEffect(() => {
    seedDatabase().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-lg">Loading Desk Hub…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' ? (
          <Dashboard onNavigateRevise={() => setActiveTab('revise')} />
        ) : (
          <Revise />
        )}
      </main>
    </div>
  );
}
