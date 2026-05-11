import { useState, useRef, useEffect } from 'react';
import { Menu, X, Activity, LogOut, User, LayoutDashboard, Users, Calendar, FileText, Package, TestTube, DollarSign, Settings, MessageSquare, ChevronDown } from 'lucide-react';
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
    { id: 'appointments', label: t.common.appointments },
    { id: 'news', label: t.common.news },
    { id: 'about', label: t.common.about },
    { id: 'contact', label: t.common.contact },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="okapia-logo-wrapper cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="okapia-logo-container">
              <img
                src="/Logo-Okapi-Medical.jpg"
                alt="OKAPIA Medical Logo"
                className="okapia-logo okapia-logo-header"
              />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">OKAPIA Medical</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.special
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium inline-flex items-center gap-2"
                    style={{ backgroundColor: '#0F4A77' }}
                  >
                    <User className="w-4 h-4" />
                    {profile?.full_name || t.common.my_account}
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                        <p className="text-xs text-gray-600">
                          {profile?.role?.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </p>
                      </div>

                      {onNavigateToDashboard && (
                        <div className="py-2">
                          <button
                            onClick={() => {
                              onNavigateToDashboard();
                              setUserMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t.common.dashboard}
                          </button>
                        </div>
                      )}

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.common.logout}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onNavigateToLogin}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                  style={{ backgroundColor: '#0F4A77' }}
                >
                  {t.common.login}
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 text-sm font-medium ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}

            {user ? (
              <>
                {onNavigateToDashboard && (
                  <button
                    onClick={() => {
                      onNavigateToDashboard();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    {t.common.my_account}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
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
                className="block w-full text-left px-4 py-3 text-sm font-medium text-blue-600"
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
