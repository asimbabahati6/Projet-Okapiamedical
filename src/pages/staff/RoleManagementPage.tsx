import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Plus, Pencil, Trash2, Archive, Lock, Search,
  CheckCircle, X, AlertTriangle, Loader2, RotateCcw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

const ADMIN_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin'];
const SYSTEM_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin'];

const PERMISSION_MODULES = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'patients', label: 'Patients' },
  { id: 'appointments', label: 'Rendez-vous' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'laboratory', label: 'Laboratoire' },
  { id: 'pharmacy', label: 'Pharmacie' },
  { id: 'radiology', label: 'Radiologie' },
  { id: 'billing', label: 'Facturation' },
  { id: 'employees', label: 'Personnel' },
];

const PERMISSION_ACTIONS = [
  { id: 'view', label: 'Voir' },
  { id: 'create', label: 'Creer' },
  { id: 'edit', label: 'Modifier' },
  { id: 'delete', label: 'Supprimer' },
];

interface Role {
  id: string;
  name: string;
  description: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  code: string;
  display_name: string;
  category: string;
  description: string | null;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

export function RoleManagementPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { success, error: showError } = useToast();
  const userRole = profile?.role?.name || '';

  useEffect(() => {
    if (profile && !ADMIN_ROLES.includes(userRole)) {
      navigate('/staff/dashboard');
    }
  }, [profile, userRole, navigate]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', level: 10 });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState<Role | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [rolesRes, permRes, rpRes] = await Promise.all([
        supabase.from('roles').select('*').order('level', { ascending: true }),
        supabase.from('permissions').select('*').order('category').order('code'),
        supabase.from('role_permissions').select('role_id, permission_id'),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (permRes.error) throw permRes.error;
      if (rpRes.error) throw rpRes.error;

      setRoles(rolesRes.data || []);
      setPermissions(permRes.data || []);
      setRolePermissions(rpRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  }

  function getRolePermissionIds(roleId: string): Set<string> {
    const ids = new Set<string>();
    rolePermissions.filter(rp => rp.role_id === roleId).forEach(rp => ids.add(rp.permission_id));
    return ids;
  }

  function openAddModal() {
    setEditingRole(null);
    setFormData({ name: '', description: '', level: 10 });
    setSelectedPermissions(new Set());
    setShowFormModal(true);
  }

  function openEditModal(role: Role) {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '', level: role.level });
    setSelectedPermissions(getRolePermissionIds(role.id));
    setShowFormModal(true);
  }

  function togglePermission(permId: string) {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  }

  function toggleModuleAll(moduleId: string) {
    const modulPerms = permissions.filter(p => p.category === moduleId);
    const allSelected = modulPerms.every(p => selectedPermissions.has(p.id));
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      modulPerms.forEach(p => {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      showError('Le nom du role est requis');
      return;
    }

    setSaving(true);
    try {
      let roleId: string;

      if (editingRole) {
        const { error } = await supabase
          .from('roles')
          .update({ name: formData.name, description: formData.description, level: formData.level })
          .eq('id', editingRole.id);
        if (error) throw error;
        roleId = editingRole.id;
      } else {
        const { data, error } = await supabase
          .from('roles')
          .insert({ name: formData.name, description: formData.description, level: formData.level })
          .select('id')
          .single();
        if (error) throw error;
        roleId = data.id;
      }

      // Sync permissions: delete all existing, re-insert selected
      await supabase.from('role_permissions').delete().eq('role_id', roleId);

      if (selectedPermissions.size > 0) {
        const inserts = Array.from(selectedPermissions).map(permId => ({
          role_id: roleId,
          permission_id: permId,
        }));
        const { error: insertErr } = await supabase.from('role_permissions').insert(inserts);
        if (insertErr) throw insertErr;
      }

      success(editingRole ? 'Role mis a jour' : 'Role cree avec succes');
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving role:', err);
      showError('Erreur lors de la sauvegarde du role');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(role: Role) {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ is_active: !role.is_active })
        .eq('id', role.id);
      if (error) throw error;
      success(role.is_active ? 'Role archive' : 'Role restaure');
      fetchData();
    } catch (err) {
      console.error('Error archiving role:', err);
      showError('Erreur lors de l\'archivage');
    }
  }

  async function handleDelete() {
    if (!showDeleteModal) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('roles').delete().eq('id', showDeleteModal.id);
      if (error) throw error;
      success('Role supprime definitivement');
      setShowDeleteModal(null);
      setDeleteConfirmText('');
      fetchData();
    } catch (err) {
      console.error('Error deleting role:', err);
      showError('Erreur lors de la suppression. Ce role est peut-etre encore assigne a des utilisateurs.');
    } finally {
      setDeleting(false);
    }
  }

  const filteredRoles = roles.filter(r => {
    if (!showArchived && !r.is_active) return false;
    if (searchTerm) {
      return r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Roles</h1>
              <p className="text-gray-600 mt-1">Creer, modifier et gerer les roles et permissions du systeme</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouveau Role
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un role..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Afficher les archives
          </label>
        </div>
      </div>

      {/* Roles List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Aucun role trouve</td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const isSystem = SYSTEM_ROLES.includes(role.name);
                  const permCount = rolePermissions.filter(rp => rp.role_id === role.id).length;
                  return (
                    <tr key={role.id} className={`hover:bg-gray-50 ${!role.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isSystem && <Lock className="w-4 h-4 text-amber-500" />}
                          <span className="font-semibold text-gray-900">{role.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {role.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Niveau {role.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {isSystem ? 'Acces complet' : `${permCount} permission${permCount !== 1 ? 's' : ''}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {role.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <Archive className="w-3 h-3" /> Archive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(role)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(role)}
                            disabled={isSystem}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSystem ? 'Role systeme protege' : (role.is_active ? 'Archiver' : 'Restaurer')}
                          >
                            {role.is_active ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(role)}
                            disabled={isSystem}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSystem ? 'Role systeme protege' : 'Supprimer definitivement'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Role Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRole ? 'Modifier le Role' : 'Nouveau Role'}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du role *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: technicien_labo"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editingRole && SYSTEM_ROLES.includes(editingRole.name) ? true : false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau hierarchique</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 10 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du role et de ses responsabilites..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Permissions matrix */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Permissions par module</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-44">Module</th>
                        {PERMISSION_ACTIONS.map(action => (
                          <th key={action.id} className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">{action.label}</th>
                        ))}
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Tout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {PERMISSION_MODULES.map(mod => {
                        const modulePerms = permissions.filter(p => p.category === mod.id);
                        const allSelected = modulePerms.length > 0 && modulePerms.every(p => selectedPermissions.has(p.id));
                        return (
                          <tr key={mod.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{mod.label}</td>
                            {PERMISSION_ACTIONS.map(action => {
                              const perm = modulePerms.find(p => p.code === `${mod.id}.${action.id}`);
                              if (!perm) return <td key={action.id} className="px-3 py-3 text-center"><span className="text-gray-300">-</span></td>;
                              return (
                                <td key={action.id} className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedPermissions.has(perm.id)}
                                    onChange={() => togglePermission(perm.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
                              );
                            })}
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() => toggleModuleAll(mod.id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''} selectionnee{selectedPermissions.size !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editingRole ? 'Enregistrer' : 'Creer le Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Supprimer le role</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Vous etes sur le point de supprimer le role <strong>"{showDeleteModal.name}"</strong>.
                Cette action est irreversible. Tous les utilisateurs assignes a ce role perdront leurs acces.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-700 font-medium">Cette action est irreversible</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tapez "<strong>{showDeleteModal.name}</strong>" pour confirmer
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={showDeleteModal.name}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(null); setDeleteConfirmText(''); }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== showDeleteModal.name || deleting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer definitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
