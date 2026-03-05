import { useState, useEffect } from 'react';
import { X, Share2, Users, Search, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { shareDocument } from '../../utils/documentWorkflowService';
import { notifyDocumentShared } from '../../utils/notificationService';

interface ShareDocumentModalProps {
  onClose: () => void;
  documentId: string;
  documentType: 'prescription' | 'lab_order' | 'consultation' | 'medical_document' | 'lab_result' | 'certificate';
  documentTitle: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: {
    name: string;
  };
}

export function ShareDocumentModal({ onClose, documentId, documentType, documentTitle }: ShareDocumentModalProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'edit' | 'validate'>('view');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStaffMembers();
  }, []);

  async function loadStaffMembers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        role:roles(name)
      `)
      .neq('id', profile?.id)
      .order('full_name');

    if (!error && data) {
      setStaffMembers(data as any);
    }
  }

  function toggleStaffSelection(staffId: string) {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
    } else {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  }

  async function handleShare() {
    if (selectedStaff.length === 0) {
      showToast('Veuillez sélectionner au moins un destinataire', 'error');
      return;
    }

    setLoading(true);

    try {
      await Promise.all(
        selectedStaff.map(async (staffId) => {
          await shareDocument(documentId, documentType, staffId, permissionLevel);
          await notifyDocumentShared(staffId, profile?.id || '', documentType, documentTitle);
        })
      );

      showToast('Document partagé avec succès', 'success');
      onClose();
    } catch (error) {
      console.error('Error sharing document:', error);
      showToast('Erreur lors du partage du document', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = staffMembers.filter(staff =>
    staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (roleName: string) => {
    const roleColors: Record<string, string> = {
      doctor: 'bg-blue-100 text-blue-800',
      nurse: 'bg-green-100 text-green-800',
      pharmacist: 'bg-purple-100 text-purple-800',
      receptionist: 'bg-yellow-100 text-yellow-800',
      hospital_admin: 'bg-red-100 text-red-800',
      super_admin: 'bg-gray-100 text-gray-800'
    };
    return roleColors[roleName] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Partager le Document</h2>
              <p className="text-sm text-blue-100">{documentTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de Permission
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPermissionLevel('view')}
                  className={`p-3 border-2 rounded-lg transition-colors ${
                    permissionLevel === 'view'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <p className="font-medium">Lecture</p>
                  <p className="text-xs mt-1 text-gray-600">Voir seulement</p>
                </button>
                <button
                  onClick={() => setPermissionLevel('edit')}
                  className={`p-3 border-2 rounded-lg transition-colors ${
                    permissionLevel === 'edit'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <p className="font-medium">Édition</p>
                  <p className="text-xs mt-1 text-gray-600">Voir et modifier</p>
                </button>
                <button
                  onClick={() => setPermissionLevel('validate')}
                  className={`p-3 border-2 rounded-lg transition-colors ${
                    permissionLevel === 'validate'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <p className="font-medium">Validation</p>
                  <p className="text-xs mt-1 text-gray-600">Valider le document</p>
                </button>
              </div>
            </div>

            {selectedStaff.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">
                    {selectedStaff.length} Destinataire{selectedStaff.length > 1 ? 's' : ''} Sélectionné{selectedStaff.length > 1 ? 's' : ''}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.map(staffId => {
                    const staff = staffMembers.find(s => s.id === staffId);
                    return staff ? (
                      <span key={staffId} className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-300">
                        <span className="text-sm font-medium">{staff.full_name}</span>
                        <button
                          onClick={() => toggleStaffSelection(staffId)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner les Destinataires
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou rôle..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {filteredStaff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => toggleStaffSelection(staff.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                      selectedStaff.includes(staff.id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedStaff.includes(staff.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {selectedStaff.includes(staff.id) ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-semibold">{staff.full_name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{staff.full_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(staff.role.name)}`}>
                            {staff.role.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleShare}
            disabled={loading || selectedStaff.length === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            {loading ? 'Partage...' : `Partager avec ${selectedStaff.length} personne${selectedStaff.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
