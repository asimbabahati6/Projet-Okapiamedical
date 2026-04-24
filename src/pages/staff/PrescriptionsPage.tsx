import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useRBAC } from '../../contexts/RBACContext';
import { Prescription, PrescriptionExportData, PharmacyStock, StockAlert } from '../../types/database';
import { exportToPDF, exportToExcel, exportSinglePrescriptionToExcel } from '../../utils/prescriptionExport';
import { FileText, Plus, Search, ListFilter as Filter, Download, Eye, TriangleAlert as AlertTriangle, Package, Activity, Pencil } from 'lucide-react';
import AddPrescriptionModal from '../../components/prescriptions/AddPrescriptionModal';
import EditPrescriptionModal from '../../components/prescriptions/EditPrescriptionModal';
import ViewPrescriptionModal from '../../components/prescriptions/ViewPrescriptionModal';
import StockAlertsPanel from '../../components/prescriptions/StockAlertsPanel';
import { formatDoctorName } from '../../utils/formatDoctorName';

export function PrescriptionsPage() {
  const { user, profile: userProfile } = useAuth();
  const { showToast } = useToast();
  const { hasPermission } = useRBAC();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);

  const isDoctor = userProfile?.role?.name === 'doctor';
  const isPharmacist = userProfile?.role?.name === 'pharmacist';
  const isAdmin = userProfile?.role?.name === 'super_admin' || userProfile?.role?.name === 'hospital_admin';

  const canCreatePrescriptions = hasPermission('create_prescriptions');
  const canEditOwnPrescriptions = hasPermission('edit_own_prescriptions');
  const canEditAllPrescriptions = hasPermission('edit_all_prescriptions');

  useEffect(() => {
    fetchPrescriptions();
    if (isPharmacist || isDoctor || isAdmin) {
      fetchStockAlerts();
    }
  }, [user, userProfile]);

  async function fetchPrescriptions() {
    try {
      setLoading(true);
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(*),
          pharmacy:pharmacies(*)
        `)
        .order('created_at', { ascending: false });

      if (isDoctor && !isAdmin) {
        query = query.eq('doctor_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const prescriptionsWithDoctors = await Promise.all((data || []).map(async (prescription) => {
        const { data: doctorData } = await supabase
          .from('user_profiles')
          .select('*, role:roles(*)')
          .eq('id', prescription.doctor_id)
          .single();

        return {
          ...prescription,
          doctor: doctorData
        };
      }));

      setPrescriptions(prescriptionsWithDoctors);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      showToast('Erreur lors du chargement des prescriptions', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStockAlerts() {
    try {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select(`
          *,
          pharmacy:pharmacies(*),
          medication:medications(*)
        `)
        .eq('acknowledged', false)
        .order('severity', { ascending: false });

      if (error) throw error;
      setStockAlerts(data || []);
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
    }
  }

  async function handleViewPrescription(prescription: Prescription) {
    try {
      const { data, error } = await supabase
        .from('prescription_items')
        .select(`
          *,
          medication:medications(*),
          alternative_medication:medications(*)
        `)
        .eq('prescription_id', prescription.id);

      if (error) {
        console.error('Error fetching prescription items:', error);
        showToast('Erreur lors du chargement des détails', 'error');
        return;
      }

      setSelectedPrescription({
        ...prescription,
        items: data || []
      });

      await logAudit(prescription.id, 'viewed');
    } catch (error) {
      console.error('Error viewing prescription:', error);
      showToast('Erreur lors de l\'affichage de la prescription', 'error');
    }
  }

  async function logAudit(prescriptionId: string, action: string) {
    try {
      await supabase
        .from('prescription_audit_log')
        .insert({
          prescription_id: prescriptionId,
          action,
          performed_by: user?.id,
          details: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  async function handleExportPDF(prescription: Prescription) {
    try {
      const { data, error } = await supabase
        .from('prescription_items')
        .select(`
          *,
          medication:medications(*)
        `)
        .eq('prescription_id', prescription.id);

      if (error) {
        console.error('Error fetching items:', error);
        showToast('Erreur lors du chargement des médicaments', 'error');
        return;
      }

      const fullPrescription: PrescriptionExportData = {
        ...prescription,
        items: data || []
      };
      exportToPDF(fullPrescription);
      await logAudit(prescription.id, 'exported_pdf');
      showToast('Prescription exportée en PDF', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Erreur lors de l\'export PDF', 'error');
    }
  }

  async function handleExportExcel(prescription?: Prescription) {
    try {
      if (prescription) {
        const { data, error } = await supabase
          .from('prescription_items')
          .select(`
            *,
            medication:medications(*)
          `)
          .eq('prescription_id', prescription.id);

        if (!error && data) {
          exportSinglePrescriptionToExcel({
            ...prescription,
            items: data
          });
          await logAudit(prescription.id, 'exported_excel');
        }
      } else {
        const prescriptionsToExport = await Promise.all(
          filteredPrescriptions.map(async (p) => {
            const { data } = await supabase
              .from('prescription_items')
              .select(`
                *,
                medication:medications(*)
              `)
              .eq('prescription_id', p.id);
            return { ...p, items: data || [] };
          })
        );
        exportToExcel(prescriptionsToExport);
      }
      showToast('Export Excel réussi', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'export', 'error');
    }
  }

  async function handleDispensePrescription(prescriptionId: string) {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          status: 'dispensed',
          dispensed_by: user?.id,
          dispensed_at: new Date().toISOString()
        })
        .eq('id', prescriptionId);

      if (error) throw error;

      await logAudit(prescriptionId, 'dispensed');
      showToast('Prescription marquée comme dispensée', 'success');
      fetchPrescriptions();
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  }

  function canEditPrescription(prescription: Prescription): boolean {
    if (prescription.status !== 'pending') return false;

    if (canEditAllPrescriptions || isAdmin) return true;

    if (canEditOwnPrescriptions && isDoctor) {
      return prescription.doctor_id === user?.id;
    }

    return false;
  }

  function getEditTooltip(prescription: Prescription): string {
    if (prescription.status === 'dispensed') {
      return 'Prescription déjà dispensée';
    }
    if (prescription.status === 'expired') {
      return 'Prescription expirée';
    }
    if (prescription.status === 'cancelled') {
      return 'Prescription annulée';
    }
    if (!canEditPrescription(prescription)) {
      return 'Vous n\'avez pas les droits de modification';
    }
    return 'Modifier cette prescription';
  }

  async function handleEditClick(prescription: Prescription) {
    if (!canEditPrescription(prescription)) {
      showToast('Vous n\'êtes pas autorisé à modifier cette prescription', 'error');
      return;
    }

    try {
      const { data: fullPrescription, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(*),
          doctor:user_profiles(*),
          pharmacy:pharmacies(*)
        `)
        .eq('id', prescription.id)
        .single();

      if (error) throw error;

      setEditingPrescription(fullPrescription);
    } catch (error) {
      console.error('Error loading prescription for edit:', error);
      showToast('Erreur lors du chargement de la prescription', 'error');
    }
  }

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch =
      prescription.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter(p => p.status === 'pending').length,
    dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
    expired: prescriptions.filter(p => p.status === 'expired').length
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Gestion des Prescriptions
          </h1>
          <p className="text-gray-600 mt-1">Système complet de gestion des ordonnances médicales</p>
        </div>
        <div className="flex gap-3">
          {(isPharmacist || isDoctor || isAdmin) && (
            <button
              onClick={() => setShowAlertsPanel(!showAlertsPanel)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors relative"
            >
              <AlertTriangle className="w-5 h-5" />
              Alertes Stock
              {stockAlerts.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {stockAlerts.length}
                </span>
              )}
            </button>
          )}
          {canCreatePrescriptions && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Prescription
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En Attente</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <Activity className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Dispensées</p>
              <p className="text-3xl font-bold text-gray-900">{stats.dispensed}</p>
            </div>
            <Package className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expirées</p>
              <p className="text-3xl font-bold text-gray-900">{stats.expired}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {showAlertsPanel && (
        <StockAlertsPanel
          alerts={stockAlerts}
          onClose={() => setShowAlertsPanel(false)}
          onRefresh={fetchStockAlerts}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par numéro ou patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="dispensed">Dispensé</option>
              <option value="expired">Expiré</option>
              <option value="cancelled">Annulé</option>
            </select>
            <button
              onClick={() => handleExportExcel()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune prescription trouvée</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Prescription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médecin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.prescription_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {prescription.patient?.first_name} {prescription.patient?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prescription.patient?.patient_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDoctorName((prescription.doctor as any)?.full_name ?? prescription.doctor?.user_profile?.full_name)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(prescription.prescription_date || prescription.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                        prescription.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {prescription.status === 'pending' ? 'En attente' :
                         prescription.status === 'dispensed' ? 'Dispensé' :
                         prescription.status === 'expired' ? 'Expiré' :
                         'Annulé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewPrescription(prescription)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {(canEditOwnPrescriptions || canEditAllPrescriptions) && (
                          <button
                            onClick={() => handleEditClick(prescription)}
                            disabled={!canEditPrescription(prescription)}
                            className={`transition-colors ${
                              canEditPrescription(prescription)
                                ? 'text-blue-600 hover:text-blue-700 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={getEditTooltip(prescription)}
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleExportPDF(prescription)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Export PDF"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleExportExcel(prescription)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Export Excel"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {isPharmacist && prescription.status === 'pending' && (
                          <button
                            onClick={() => handleDispensePrescription(prescription.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs transition-colors"
                          >
                            Dispenser
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddPrescriptionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPrescriptions();
          }}
        />
      )}

      {editingPrescription && (
        <EditPrescriptionModal
          prescription={editingPrescription}
          onClose={() => setEditingPrescription(null)}
          onSuccess={() => {
            setEditingPrescription(null);
            fetchPrescriptions();
          }}
        />
      )}

      {selectedPrescription && (
        <ViewPrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          onDispense={isPharmacist ? handleDispensePrescription : undefined}
        />
      )}
    </div>
  );
}

export default PrescriptionsPage;
