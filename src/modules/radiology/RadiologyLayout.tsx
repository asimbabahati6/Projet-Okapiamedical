import { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  FileEdit,
  Eye,
  History,
  PlusCircle,
  Activity,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRadiologyPermissions } from '../../hooks/useRadiologyPermissions';

export default function RadiologyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const permissions = useRadiologyPermissions();

  const menuItems = useMemo(() => {
    const items = [];

    if (permissions.canViewAll) {
      items.push({
        path: '/staff/radiology/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard
      });
    }

    if (permissions.canPrescribe) {
      items.push({
        path: '/staff/radiology/prescribe',
        label: 'Prescrire Examen',
        icon: PlusCircle
      });
    }

    if (permissions.canPerformExams) {
      items.push({
        path: '/staff/radiology/queue',
        label: "File d'attente",
        icon: ListChecks
      });
      items.push({
        path: '/staff/radiology/workspace',
        label: 'Espace de travail',
        icon: FileEdit
      });
    }

    if (permissions.canViewAll) {
      items.push({
        path: '/staff/radiology/viewer',
        label: 'Visualiseur',
        icon: Eye
      });
      items.push({
        path: '/staff/radiology/history',
        label: 'Historique',
        icon: History
      });
    }

    return items;
  }, [permissions]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/staff/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-gradient-to-b from-cyan-600 to-cyan-700 min-h-screen transition-all duration-300 flex flex-col`}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-cyan-500">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">Radiologie</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-cyan-500 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white text-cyan-700'
                      : 'text-cyan-50 hover:bg-cyan-500'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-cyan-500">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-cyan-50 hover:bg-cyan-500 transition-colors w-full"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Déconnexion</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
