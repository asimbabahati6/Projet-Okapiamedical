import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, FlaskConical, Pill,
  ChevronLeft, ChevronRight, Menu, X, Plus, Stethoscope, Activity, LogOut,
} from 'lucide-react';
import { DemoWorkflowProvider, useWorkflow } from '../../contexts/WorkflowContext';
import { RoleSwitcher, RoleBadge } from '../../components/demo/RoleSwitcher';

const NAV_ITEMS = {
  medecin: [
    { to: '/demo', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/demo/patients', label: 'Patients', icon: Users },
    { to: '/demo/consultations', label: 'Consultations', icon: FileText },
    { to: '/demo/nouvelle-consultation', label: 'Nouvelle consultation', icon: Plus, highlight: true },
  ],
  laborantin: [
    { to: '/demo/laboratoire', label: "Demandes d'examens", icon: FlaskConical, end: true },
    { to: '/demo/laborantin-dashboard', label: 'Tableau de bord', icon: Activity },
  ],
  pharmacien: [
    { to: '/demo/pharmacie', label: 'Ordonnances', icon: Pill, end: true },
    { to: '/demo/pharmacien-dashboard', label: 'Tableau de bord', icon: Activity },
  ],
} as const;

function DemoInner() {
  const { role } = useWorkflow();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_ITEMS[role];
  const sidebarBorder = role === 'medecin' ? 'border-blue-100' : role === 'laborantin' ? 'border-emerald-100' : 'border-orange-100';
  const activeClass = role === 'medecin' ? 'bg-blue-50 text-blue-700 font-semibold' : role === 'laborantin' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-orange-50 text-orange-700 font-semibold';
  const logoAccent = role === 'medecin' ? 'text-blue-600' : role === 'laborantin' ? 'text-emerald-600' : 'text-orange-500';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full bg-white border-r ${sidebarBorder} z-30 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`flex items-center gap-3 px-4 py-4 border-b ${sidebarBorder} min-h-[64px]`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-current flex items-center justify-center ${logoAccent}`}>
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-sm leading-tight">OKAPIA Medical</div>
              <div className={`text-xs font-medium ${logoAccent}`}>Démo RBAC</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} className="hidden lg:flex p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-auto flex-shrink-0">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && <div className="px-3 py-3 border-b border-gray-100"><RoleBadge /></div>}

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isHighlight = 'highlight' in item && item.highlight;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                    isHighlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700 font-medium mt-2'
                      : isActive
                      ? activeClass
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isHighlight ? 'text-white' : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className={`px-2 py-3 border-t ${sidebarBorder}`}>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Retour app</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <RoleSwitcher />
        </header>
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}

export function DemoLayout() {
  return (
    <DemoWorkflowProvider>
      <DemoInner />
    </DemoWorkflowProvider>
  );
}
