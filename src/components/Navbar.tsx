import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActivePage =
  | 'landing'
  | 'discover'
  | 'scanner'
  | 'dashboard'
  | 'report'
  | 'admin';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenAuth: (mode?: 'student' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  onOpenAuth,
}) => {
  const { user, profile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ id: ActivePage; label: string }> = [
    { id: 'discover', label: 'Discover' },
    { id: 'scanner', label: 'URL Scanner' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'report', label: 'Report Scam' },
    { id: 'admin', label: 'Admin' },
  ];

  const handleNav = (page: ActivePage) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0B162C] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => handleNav('landing')}
          className="text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
        >
          ScholarShield
        </button>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 ${
                  isActive
                    ? 'border-b-2 border-cyan-400 text-white'
                    : 'border-b-2 border-transparent text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="hidden md:flex items-center shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              title={`Signed in as ${profile?.email || user.email}`}
            >
              Sign Out ({profile?.fullName?.split(' ')[0] || user.email?.split('@')[0] || 'Account'})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('student')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800 md:hidden"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-[#0B162C] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`min-h-[44px] rounded-lg px-3 py-2 text-left text-sm font-medium ${
                  activePage === item.id
                    ? 'bg-blue-700/40 text-cyan-300'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 border-t border-slate-800 pt-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="min-h-[44px] w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
                >
                  Sign Out ({user.email})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth('student');
                  }}
                  className="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
