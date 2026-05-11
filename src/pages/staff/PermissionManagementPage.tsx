import { useState, useEffect } from 'react';
import { Shield, Search, RefreshCw, Check, X, ChevronDown, ChevronRight, Users, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Permission {
  id: string;
  code: string;
  display_name: string;
  category: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
}

interface RolePermissionEntry {
  role_id: string;
  permission_id: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  patients: 'Patients',
  appointments: 'Rendez-vous',
  consultations: 'Consultations',
  prescriptions: 'Prescriptions',
  laboratory: 'Laboratoire',
  pharmacy: 'Pharmacie',
  radiology: 'Radiologie',
  billing: 'Facturation & Finance',
  employees: 'Personnel & RH',
  logistics: 'Logistique',
  admin: 'Administration',
};

const CATEGORY_ORDER = [
  'dashboard', 'patients', 'appointments', 'consultations', 'prescriptions',
  'laboratory', 'pharmacy', 'radiology', 'billing', 'employees', 'logistics', 'admin',
];

export default function PermissionManagementPage() {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<RolePermissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [permRes, roleRes, assignRes] = await Promise.all([
        supabase.from('permissions').select('*').order('category').order('code'),
        supabase.from('roles').select('*').order('level', { ascending: true }),
        supabase.from('role_permissions').select('role_id, permission_id'),
      ]);

      if (permRes.data) setPermissions(permRes.data);
      if (roleRes.data) setRoles(roleRes.data.filter(r => r.level > 2));
      if (assignRes.data) setAssignments(assignRes.data);
    } catch (error) {
      console.error('Error loading permission data:', error);
    } finally {
      setLoading(false);
    }
  }

  function isAssigned(roleId: string, permissionId: string): boolean {
    const changeKey = `${roleId}:${permissionId}`;
    if (pendingChanges.has(changeKey)) {
      return pendingChanges.get(changeKey)!;
    }
    return assignments.some(a => a.role_id === roleId && a.permission_id === permissionId);
  }

  function togglePermission(roleId: string, permissionId: string) {
    const changeKey = `${roleId}:${permissionId}`;
    const currentState = isAssigned(roleId, permissionId);
    const newChanges = new Map(pendingChanges);
    newChanges.set(changeKey, !currentState);
    setPendingChanges(newChanges);
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const toGrant: { role_id: string; permission_id: string; granted_by: string }[] = [];
      const toRevoke: { role_id: string; permission_id: string }[] = [];

      pendingChanges.forEach((newState, key) => {
        const [roleId, permissionId] = key.split(':');
        const wasAssigned = assignments.some(a => a.role_id === roleId && a.permission_id === permissionId);

        if (newState && !wasAssigned) {
          toGrant.push({ role_id: roleId, permission_id: permissionId, granted_by: profile!.id });
        } else if (!newState && wasAssigned) {
          toRevoke.push({ role_id: roleId, permission_id: permissionId });
        }
      });

      if (toGrant.length > 0) {
        const { error } = await supabase.from('role_permissions').insert(toGrant);
        if (error) throw error;
      }

      for (const item of toRevoke) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', item.role_id)
          .eq('permission_id', item.permission_id);
        if (error) throw error;
      }

      // Log audit entries
      const permMap = new Map(permissions.map(p => [p.id, p.code]));
      for (const item of toGrant) {
        await supabase.from('permission_audit_log').insert({
          user_id: profile!.id,
          action: 'grant',
          permission_code: permMap.get(item.permission_id) || '',
          target_role_id: item.role_id,
          metadata: {},
        });
      }
      for (const item of toRevoke) {
        await supabase.from('permission_audit_log').insert({
          user_id: profile!.id,
          action: 'revoke',
          permission_code: permMap.get(item.permission_id) || '',
          target_role_id: item.role_id,
          metadata: {},
        });
      }

      setPendingChanges(new Map());
      await loadData();
    } catch (error) {
      console.error('Error saving permission changes:', error);
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(category: string) {
    const next = new Set(expandedCategories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    setExpandedCategories(next);
  }

  const groupedPermissions = CATEGORY_ORDER.reduce((acc, category) => {
    const catPerms = permissions.filter(p => p.category === category);
    if (catPerms.length > 0) {
      acc[category] = catPerms;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  const displayedRoles = selectedRole
    ? roles.filter(r => r.id === selectedRole)
    : roles;

  const filteredCategories = Object.entries(groupedPermissions).filter(([, perms]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return perms.some(p =>
      p.code.toLowerCase().includes(q) ||
      p.display_name.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-600" />
            Gestion des Permissions
          </h1>
          <p className="text-gray-600 mt-1">Attribuez des permissions granulaires a chaque role</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingChanges.size > 0 && (
            <span className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
              {pendingChanges.size} modification(s) en attente
            </span>
          )}
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          {pendingChanges.size > 0 && (
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une permission..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <select
            value={selectedRole || ''}
            onChange={(e) => setSelectedRole(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les roles ({roles.length})</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.description || role.name} (Niv. {role.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3 text-sm text-gray-600">
        <Lock className="w-4 h-4 text-gray-400" />
        <span>Les roles administrateurs (niveau 1-2) disposent automatiquement de toutes les permissions et ne sont pas affiches ici.</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[280px]">Permission</th>
                {displayedRoles.map(role => (
                  <th key={role.id} className="text-center px-2 py-3 font-medium text-gray-700 min-w-[100px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs truncate max-w-[90px]" title={role.description}>
                        {role.name.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400">Niv. {role.level}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(([category, perms]) => (
                <CategorySection
                  key={category}
                  category={category}
                  permissions={perms}
                  roles={displayedRoles}
                  isExpanded={expandedCategories.has(category)}
                  onToggle={() => toggleCategory(category)}
                  isAssigned={isAssigned}
                  onTogglePermission={togglePermission}
                  pendingChanges={pendingChanges}
                  searchQuery={searchQuery}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface CategorySectionProps {
  category: string;
  permissions: Permission[];
  roles: Role[];
  isExpanded: boolean;
  onToggle: () => void;
  isAssigned: (roleId: string, permId: string) => boolean;
  onTogglePermission: (roleId: string, permId: string) => void;
  pendingChanges: Map<string, boolean>;
  searchQuery: string;
}

function CategorySection({
  category,
  permissions,
  roles,
  isExpanded,
  onToggle,
  isAssigned,
  onTogglePermission,
  pendingChanges,
  searchQuery,
}: CategorySectionProps) {
  const filteredPerms = searchQuery
    ? permissions.filter(p =>
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : permissions;

  if (filteredPerms.length === 0) return null;

  const assignedCount = roles.reduce((total, role) => {
    return total + filteredPerms.filter(p => isAssigned(role.id, p.id)).length;
  }, 0);

  const totalCells = roles.length * filteredPerms.length;

  return (
    <>
      <tr
        className="bg-gray-100 cursor-pointer hover:bg-gray-150 border-t border-gray-200"
        onClick={onToggle}
      >
        <td className="px-4 py-2.5 font-semibold text-gray-800" colSpan={roles.length + 1}>
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>{CATEGORY_LABELS[category] || category}</span>
            <span className="text-xs text-gray-500 font-normal ml-2">
              {assignedCount}/{totalCells} attribuees
            </span>
          </div>
        </td>
      </tr>
      {isExpanded && filteredPerms.map(perm => (
        <tr key={perm.id} className="border-t border-gray-100 hover:bg-blue-50/30">
          <td className="px-4 py-2 pl-10">
            <div>
              <span className="font-medium text-gray-800">{perm.display_name}</span>
              <span className="ml-2 text-xs text-gray-400 font-mono">{perm.code}</span>
            </div>
          </td>
          {roles.map(role => {
            const assigned = isAssigned(role.id, perm.id);
            const changeKey = `${role.id}:${perm.id}`;
            const hasChange = pendingChanges.has(changeKey);

            return (
              <td key={role.id} className="text-center px-2 py-2">
                <button
                  onClick={() => onTogglePermission(role.id, perm.id)}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                    assigned
                      ? hasChange
                        ? 'bg-green-200 border-2 border-green-500'
                        : 'bg-green-100 border border-green-300 hover:bg-green-200'
                      : hasChange
                        ? 'bg-red-100 border-2 border-red-400'
                        : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {assigned ? (
                    <Check className="w-3.5 h-3.5 text-green-700" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
