import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Lock, Activity, Building2, DollarSign, Settings, Users, Calendar, Stethoscope, UserCog, FileText, Briefcase, FlaskConical, Pill, Package, DoorOpen, UserCheck, BookUser, CalendarClock, Coffee, Warehouse, Truck, Building, TrendingUp, Ligature as FileSignature, Shield, Wallet, LayoutDashboard, Newspaper, Home, Store, FileCheck, Receipt, MessageSquare, Fingerprint, BarChart3, Play } from 'lucide-react';
import { MENU_STRUCTURE, MenuItem, hasAccess, filterMenuByRole, ROLE_LABELS, UserRole } from '../../config/rbac';
import { useRBAC } from '../../contexts/RBACContext';
import { getAllSimulatorRoles, getRoleDisplayName, isAdminRole } from '../../utils/roleMapping';

const ICON_MAP: Record<string, any> = {
  Activity,
  Building2,
  DollarSign,
  Settings,
  Users,
  Calendar,
  Stethoscope,
  UserCog,
  FileText,
  Briefcase,
  FlaskConical,
  Pill,
  Package,
  DoorOpen,
  UserCheck,
  BookUser,
  CalendarClock,
  Coffee,
  Warehouse,
  Truck,
  Building,
  TrendingUp,
  FileSignature,
  Shield,
  Wallet,
  LayoutDashboard,
  Newspaper,
  Home,
  Store,
  FileCheck,
  Receipt,
  MessageSquare,
  Fingerprint,
  BarChart3
};

interface MenuItemComponentProps {
  item: MenuItem;
  level: number;
  userRole: UserRole;
  isSimulationMode: boolean;
  showAllItems: boolean;
}

function MenuItemComponent({ item, level, userRole, isSimulationMode, showAllItems }: MenuItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const hasAccessToItem = hasAccess(userRole, item);
  const Icon = ICON_MAP[item.icon] || FileText;

  const isActive = item.path === location.pathname;
  const hasChildren = item.children && item.children.length > 0;

  const categoryColors = {
    medical: 'text-blue-600 bg-blue-50 border-blue-200',
    administrative: 'text-purple-600 bg-purple-50 border-purple-200',
    commercial: 'text-green-600 bg-green-50 border-green-200'
  };

  const categoryColor = item.category ? categoryColors[item.category] : '';

  // Show locked items only when simulation mode is OFF and showAllItems is true
  if (!hasAccessToItem && showAllItems && !isSimulationMode) {
    return (
      <div
        className={`flex items-center justify-between px-4 py-2 text-gray-400 cursor-not-allowed ${
          level === 0 ? 'font-semibold text-sm' : 'text-sm'
        }`}
        style={{ paddingLeft: `${level * 16 + 16}px` }}
        title={`Accessible aux rôles: ${item.roles.map(r => ROLE_LABELS[r]).join(', ')}`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4" />
          <span>{item.label}</span>
        </div>
        <Lock className="w-4 h-4" />
      </div>
    );
  }

  // Hide items without access when in simulation mode or when not showing all items
  if (!hasAccessToItem) {
    return null;
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
            level === 0
              ? `font-semibold text-sm border-l-4 ${categoryColor} mb-1`
              : 'text-sm hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 16}px` }}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {isExpanded && (
          <div className="bg-gray-50">
            {item.children.map(child => (
              <MenuItemComponent
                key={child.id}
                item={child}
                level={level + 1}
                userRole={userRole}
                isSimulationMode={isSimulationMode}
                showAllItems={showAllItems}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.path) {
    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 16}px` }}
      >
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return null;
}

export default function RBACNavigation() {
  const { userRole, actualRole, setUserRole, isSimulationMode, setSimulationMode, resetSimulation } = useRBAC();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which menu to show
  const showAllItems = !isSimulationMode && isAdminRole(actualRole);
  const menuToDisplay = isSimulationMode
    ? filterMenuByRole(MENU_STRUCTURE, userRole)
    : (showAllItems ? MENU_STRUCTURE : filterMenuByRole(MENU_STRUCTURE, userRole));

  const allRoles = getAllSimulatorRoles();

  // Auto-navigate to specialized dashboard when role changes
  useEffect(() => {
    if (isSimulationMode) {
      const roleRoutes: Record<string, string> = {
        'laboratory': '/laboratory/dashboard',
        'pharmacist': '/pharmacy/dashboard',
        'doctor': '/doctor/dashboard',
        'admin': '/staff/dashboard',
        'administrative': '/staff/dashboard',
        'accountant': '/staff/dashboard',
        'receptionist': '/staff/dashboard',
        'logistician': '/staff/dashboard'
      };

      const targetRoute = roleRoutes[userRole];
      if (targetRoute && location.pathname !== targetRoute) {
        navigate(targetRoute);
      }
    }
  }, [userRole, isSimulationMode, navigate, location.pathname]);

  return (
    <div className="flex flex-col h-full">
      {/* Simulation Mode Active Banner */}
      {isSimulationMode && (
        <div className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold flex items-center justify-between">
          <span>MODE SIMULATION ACTIF - Visualisation: {getRoleDisplayName(userRole)}</span>
          <button
            onClick={resetSimulation}
            className="px-2 py-1 bg-white text-amber-600 rounded hover:bg-amber-50 transition-colors"
          >
            Retour à mon rôle
          </button>
        </div>
      )}

      {/* Role Simulator */}
      <div className={`p-4 border-b-2 ${
        isSimulationMode
          ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold ${
            isSimulationMode ? 'text-amber-900' : 'text-blue-800'
          }`}>
            {isSimulationMode ? 'Rôle Simulé' : 'Mon Rôle'}
          </span>
          <button
            onClick={() => setSimulationMode(!isSimulationMode)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              isSimulationMode
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSimulationMode ? '✓ Mode Simulation' : 'Activer Simulation'}
          </button>
        </div>

        {/* Always show role selector for admins and when simulation is active */}
        {(isSimulationMode || isAdminRole(actualRole)) ? (
          <select
            value={userRole}
            onChange={(e) => {
              const newRole = e.target.value as UserRole;
              if (!isSimulationMode) {
                setSimulationMode(true);
              }
              setUserRole(newRole);
            }}
            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
          >
            {allRoles.map(role => (
              <option key={role} value={role}>
                {getRoleDisplayName(role)}
              </option>
            ))}
          </select>
        ) : (
          <div className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
            {getRoleDisplayName(userRole)}
          </div>
        )}

        {/* Helper text */}
        {!isSimulationMode && isAdminRole(actualRole) && (
          <p className="mt-2 text-xs text-blue-700">
            💡 Sélectionnez un rôle ci-dessus pour activer le mode simulation
          </p>
        )}
      </div>

      {/* Dashboard Link */}
      <Link
        to="/staff/dashboard"
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b ${
          location.pathname === '/staff/dashboard'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Tableau de Bord Principal</span>
      </Link>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto">
        <nav className="py-2">
          {menuToDisplay.map(item => (
            <MenuItemComponent
              key={item.id}
              item={item}
              level={0}
              userRole={userRole}
              isSimulationMode={isSimulationMode}
              showAllItems={showAllItems}
            />
          ))}
        </nav>
      </div>

      {/* Exchange Rate Widget */}
      {(userRole === 'admin' || userRole === 'accountant') && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Taux de Change</span>
            </div>
            <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full animate-pulse">
              Live
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">USD/CDF</span>
              <span className="font-semibold text-green-700">2,850 FC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EUR/CDF</span>
              <span className="font-semibold text-green-700">3,120 FC</span>
            </div>
          </div>
          <button className="w-full mt-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors">
            Mettre à jour les taux
          </button>
        </div>
      )}

      {/* Demo RBAC Link */}
      <div className="px-4 pb-3 pt-1 border-t border-gray-200">
        <Link
          to="/demo"
          className="flex items-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm"
        >
          <Play className="w-4 h-4 flex-shrink-0" />
          <span>Démo RBAC Workflow</span>
        </Link>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Médecin → Labo → Pharmacie
        </p>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-gray-100 border-t text-xs text-gray-600 text-center">
        <div className="font-semibold">Okapi Medical System</div>
        <div className="mt-1">v2.0 - RBAC Enabled</div>
      </div>
    </div>
  );
}
