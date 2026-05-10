import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/core/contexts/NotificationContext';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  FlaskConical,
  Calendar,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';

export const DoctorLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const menuItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/patients', label: 'Dossiers Patients', icon: Users },
    { path: '/doctor/consultations', label: 'Consultations', icon: ClipboardList },
    { path: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
    { path: '/doctor/lab-orders', label: 'Analyses', icon: FlaskConical },
    { path: '/doctor/schedule', label: 'Agenda', icon: Calendar }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/staff/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">MediCare Pro</h1>
          <p className="text-sm text-gray-600 mt-1">Espace Médecin</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Link
            to="/doctor/settings"
            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Paramètres</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Bienvenue, Dr. {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucune notification
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            markAsRead(notification.id);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
};
