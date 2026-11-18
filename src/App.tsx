import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ActivePage, Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ScholarshipDiscovery } from './components/ScholarshipDiscovery';
import { UrlScannerPage } from './components/UrlScannerPage';
import { StudentDashboard } from './components/StudentDashboard';
import { ReportScamPage } from './components/ReportScamPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { SkillBridgePage } from './components/SkillBridgePage';

function AppShell() {
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPortal, setAuthPortal] = useState<'student' | 'admin'>('student');

  // Shared cross-page state
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverState, setDiscoverState] = useState('All');
  const [discoverLevel, setDiscoverLevel] = useState('All');
  const [scannerInitialUrl, setScannerInitialUrl] = useState('');

  const handleOpenAuth = (portal: 'student' | 'admin' = 'student') => {
    setAuthPortal(portal);
    setAuthModalOpen(true);
  };

  const handleQuickSearch = (query: string, state: string, level: string) => {
    setDiscoverQuery(query);
    setDiscoverState(state);
    setDiscoverLevel(level);
    setActivePage('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenScannerWithUrl = (url: string) => {
    setScannerInitialUrl(url);
    setActivePage('scanner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      <main>
        {activePage === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onQuickSearch={handleQuickSearch}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activePage === 'discover' && (
          <ScholarshipDiscovery
            initialQuery={discoverQuery}
            initialState={discoverState}
            initialLevel={discoverLevel}
            onOpenAuth={() => handleOpenAuth('student')}
            onOpenScannerWithUrl={handleOpenScannerWithUrl}
          />
        )}

        {activePage === 'skillbridge' && <SkillBridgePage />}

        {activePage === 'scanner' && (
          <UrlScannerPage initialUrl={scannerInitialUrl} />
        )}

        {activePage === 'dashboard' && (
          <StudentDashboard
            onOpenAuth={() => handleOpenAuth('student')}
            onNavigateDiscover={() => handleNavigate('discover')}
          />
        )}

        {activePage === 'report' && <ReportScamPage />}

        {activePage === 'admin' && (
          <AdminDashboard onOpenAdminAuth={() => handleOpenAuth('admin')} />
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        initialPortal={authPortal}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
