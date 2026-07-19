import { useState, useRef, useEffect } from 'react';
import { Menu, X, LogOut, User, Calendar, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onNavigateToLogin: () => void;
  onNavigateToDashboard?: () => void;
}

export function Header({ onNavigate, currentPage, onNavigateToLogin, onNavigateToDashboard }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await signOut();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }

  const navItems = [
    { id: 'home', label: t.common.home },
    { id: 'services', label: t.common.services },
    { id: 'news', label: t.common.news },
    { id: 'about', label: t.common.about },
    { id: 'contact', label: t.common.contact },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo */}
          <div className="okapia-logo-wrapper cursor-pointer flex items-center gap-3" onClick={() => onNavigate('home')}>
            <div className="okapia-logo-container">
              <img
                src="/Logo-Okapi-Medical.jpg"
                alt="OKAPIA Medical Logo"
                className="okapia-logo okapia-logo-header"
              />
            </div>
            <span className="font-display font-semibold text-lg text-ink tracking-tight hidden sm:block">
              OKAPIA <span className="text-brand-600">Medical</span>
            </span>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative text-sm font-medium transition-colors pb-1 ${
                  currentPage === item.id
                    ? 'text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {item.label}
                <span
                  className={`absolute left-0 -bottom-0.5 h-[2px] rounded-full bg-brand-600 transition-all duration-300 ${
                    currentPage === item.id ? 'w-full' : 'w-0'
                  }`}
                />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* CTA rendez-vous */}
            <button
              onClick={() => onNavigate('appointments')}
              className="hidden md:inline-flex btn-primary !py-2.5 !px-5"
            >
              <Calendar className="w-4 h-4" />
              {t.common.appointments}
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-line hover:bg-sand transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center">
                    {(profile?.full_name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </span>
                  <ChevronDown className="w-4 h-4 text-ink-muted" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 card overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-line">
                      <p className="text-sm font-medium text-ink truncate">{profile?.full_name}</p>
                      <p className="text-xs text-ink-muted truncate">{user.email}</p>
                    </div>
                    {onNavigateToDashboard && (
                      <button
                        onClick={() => {
                          onNavigateToDashboard();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-sand transition-colors"
                      >
                        <User className="w-4 h-4" />
                        {t.common.my_account}
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.common.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onNavigateToLogin}
                className="hidden md:inline-flex btn !py-2.5 !px-5 bg-brand-800 text-white hover:bg-brand-900 transition-colors"
              >
                {t.common.login}
              </button>
            )}

            {/* Burger mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ink"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-line animate-fade-in">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-lg ${
                  currentPage === item.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-muted hover:bg-sand'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => {
                onNavigate('appointments');
                setMobileMenuOpen(false);
              }}
              className="btn-primary w-full mt-3"
            >
              <Calendar className="w-4 h-4" />
              {t.common.appointments}
            </button>

            {user ? (
              <>
                {onNavigateToDashboard && (
                  <button
                    onClick={() => {
                      onNavigateToDashboard();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 mt-2 text-sm font-medium text-ink hover:bg-sand rounded-lg inline-flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    {t.common.my_account}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg inline-flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t.common.logout}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onNavigateToLogin();
                  setMobileMenuOpen(false);
                }}
                className="btn w-full mt-2 bg-brand-800 text-white hover:bg-brand-900"
              >
                {t.common.login}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
