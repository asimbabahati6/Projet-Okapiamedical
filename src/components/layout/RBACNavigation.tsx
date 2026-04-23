import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Lock, Activity, Building2, DollarSign, Settings, Users, Calendar, Stethoscope, UserCog, FileText, Briefcase, FlaskConical, Pill, Package, DoorOpen, UserCheck, BookUser, CalendarClock, Coffee, Warehouse, Truck, Building, TrendingUp, Shield, Wallet, LayoutDashboard, Newspaper, Hop as Home, Store, FileCheck, Receipt, MessageSquare, FingerprintPattern as Fingerprint, ChartBar as BarChart3 } from 'lucide-react';
import { MENU_STRUCTURE, type MenuItem, filterMenuByRole, ROLE_LABELS, DASHBOARD_ALLOWED_ROLES, hasAccess } from '../../config/rbac';
import { useRBAC } from '../../contexts/RBACContext';
import { getAllSimulatorRoles } from '../../utils/roleMapping';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity, Building2, DollarSign, Settings, Users, Calendar, Stethoscope, UserCog,
  FileText, Briefcase, FlaskConical, Pill, Package, DoorOpen, UserCheck, BookUser,
  CalendarClock, Coffee, Warehouse, Truck, Building, TrendingUp, Shield, Wallet,
  LayoutDashboard, Newspaper, Home, Store, FileCheck, Receipt, MessageSquare,
  Fingerprint, BarChart3, Lock,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Lock;
  return <Icon className={className} />;
}

function NavItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path ? location.pathname === item.path : false;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
            depth === 0
              ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <NavIcon name={item.icon} className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left truncate">{item.label}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {open && (
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map(child => (
              <NavItem key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.path ?? '#'}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
      style={{ paddingLeft: `${12 + depth * 12}px` }}
    >
      <NavIcon name={item.icon} className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function RBACNavigation() {
  const { currentRole, setCurrentRole } = useRBAC();
  const [showSimulator, setShowSimulator] = useState(false);
  const filteredMenu = filterMenuByRole(MENU_STRUCTURE, currentRole);
  const simulatorRoles = getAllSimulatorRoles();
  const canSeeMainDashboard = hasAccess(currentRole, DASHBOARD_ALLOWED_ROLES);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 w-64 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 min-h-[64px]">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm leading-tight">OKAPIA Medical</div>
          <div className="text-xs text-blue-600 font-medium">Système de Gestion</div>
        </div>
      </div>

      {/* Role simulator toggle */}
      <div className="px-3 py-2 border-b border-gray-100">
        <button
          onClick={() => setShowSimulator(s => !s)}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
        >
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">
            {showSimulator ? 'Masquer simulateur' : 'Sélectionner un rôle ci-dessus pour activer le mode simulation'}
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showSimulator ? 'rotate-180' : ''}`} />
        </button>

        {showSimulator && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-1">Simuler un rôle</p>
            {simulatorRoles.map(role => (
              <button
                key={role}
                onClick={() => { setCurrentRole(role); setShowSimulator(false); }}
                className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  currentRole === role
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{ROLE_LABELS[role]}</span>
                {!hasAccess(role, DASHBOARD_ALLOWED_ROLES) && (
                  <Lock className="w-3 h-3 opacity-60" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {/* Main dashboard — only for admin & medical_director */}
        {canSeeMainDashboard && (
          <Link
            to="/staff/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span>Tableau de Bord Principal</span>
          </Link>
        )}

        {/* Role-filtered menu */}
        {filteredMenu.map(item => (
          <NavItem key={item.id} item={item} depth={0} />
        ))}
      </nav>

      {/* Current role badge */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasAccess(currentRole, DASHBOARD_ALLOWED_ROLES) ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs text-gray-600 truncate">{ROLE_LABELS[currentRole]}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-100 border-t text-xs text-gray-600 text-center">
        <div className="font-semibold">Okapi Medical System</div>
        <div className="mt-1">v2.0 - RBAC Enabled</div>
      </div>
    </div>
  );
}
