import { useState, Component, ReactNode } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { LogOut, Menu, X, Moon, Sun, AlertTriangle, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';
import ChatNotificationBell from '../../components/chat/ChatNotificationBell';
import RBACNavigation from '../../components/layout/RBACNavigation';
import { SimulationModeBanner } from '../../components/simulation/SimulationModeBanner';
import { SimulationFloatingBadge } from '../../components/simulation/SimulationFloatingBadge';

class PageErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Une erreur est survenue</h2>
          <p className="text-gray-600 mb-4">Cette page n'a pas pu se charger correctement.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function StaffLayout() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/admin');
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <SimulationModeBanner />

      <div className="flex flex-1">
      <aside className={`${sidebarOpen ? 'w-80' : 'w-20'} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col shadow-lg`}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="okapia-logo-container">
                  <img
                    src="/Logo-Okapi-Medical.jpg"
                    alt="OKAPIA Medical Logo"
                    className="okapia-logo okapia-logo-sidebar w-10 h-10"
                  />
                </div>
                <div>
                  <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    OKAPIA Medical
                  </span>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Système RBAC v2.0
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto okapia-logo-container">
                <img
                  src="/Logo-Okapi-Medical.jpg"
                  alt="OKAPIA Medical Logo"
                  className="okapia-logo okapia-logo-sidebar-collapsed w-8 h-8"
                />
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className={`p-1.5 rounded hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
              >
                <X className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            )}
          </div>
        </div>

        {sidebarOpen && <RBACNavigation />}

        {sidebarOpen && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="mb-4 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                  <p className="text-xs text-gray-600">
                    {profile?.role?.name?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                  title={darkMode ? 'Mode clair' : 'Mode sombre'}
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/staff/profile')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mb-1"
            >
              <UserCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Mon Profil</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Déconnexion</span>
            </button>
          </div>
        )}
      </aside>

      <main className={`flex-1 overflow-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="flex items-center justify-end gap-2 mb-4">
            <PageErrorBoundary>
              <ChatNotificationBell />
            </PageErrorBoundary>
            <PageErrorBoundary>
              <NotificationCenter />
            </PageErrorBoundary>
          </div>
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </div>
      </main>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          title="Ouvrir le menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      <SimulationFloatingBadge />
      </div>
    </div>
  );
}
