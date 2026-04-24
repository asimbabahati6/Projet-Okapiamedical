import { useState, useEffect } from 'react';
import {
  Package, Plus, Download, Search, Filter, AlertTriangle,
  TrendingUp, DollarSign, FileText, ShoppingCart, Eye,
  CheckCircle, Clock, XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { AddMedicationModal } from '../../components/pharmacy/AddMedicationModal';
import { useRolePermissions } from '../../hooks/useRolePermissions';
import { usePharmacyPermissions } from '../../hooks/usePharmacyPermissions';
import { ReadOnlyBadge, FullAccessBadge } from '../../components/common/PermissionBadges';
import { LimitedAccessNotice } from '../../components/common/AccessMessages';
import { ButtonWithPermission } from '../../components/common/ButtonWithPermission';
import { ProtectedAction } from '../../components/common/ProtectedAction';

interface Medication {
  id: string;
  medication_code: string;
  generic_name: string;
  brand_name: string;
  category: string;
  dosage_form: string;
  strength: string;
  quantity_in_stock: number;
  reorder_level: number;
  unit_price: number;
  expiry_date: string;
  supplier: string;
  is_controlled_substance: boolean;
  created_at: string;
}

interface PendingPrescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  doctor_id: string;
  prescription_date: string;
  status: string;
  patient?: {
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  doctor?: {
    full_name: string;
  };
  items?: Array<{
    medication_id: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
  }>;
}

export function EnhancedPharmacyPage() {
  const permissions = useRolePermissions('pharmacy');
  const pharmacyPermissions = usePharmacyPermissions();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState<PendingPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions' | 'history'>('inventory');
  const [stats, setStats] = useState({
    totalMedications: 0,
    lowStockCount: 0,
    expiringSoon: 0,
    pendingPrescriptions: 0,
    totalValue: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchMedications(),
        fetchPendingPrescriptions(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMedications() {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('generic_name');

    if (error) throw error;
    setMedications(data || []);
  }

  async function fetchPendingPrescriptions() {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patients(first_name, last_name, patient_number),
        doctor:user_profiles!prescriptions_doctor_id_fkey(full_name),
        items:prescription_items(*)
      `)
      .eq('status', 'pending')
      .order('prescription_date', { ascending: false })
      .limit(20);

    if (error) throw error;
    setPendingPrescriptions(data || []);
  }

  async function fetchStats() {
    const { data: medications } = await supabase
      .from('medications')
      .select('quantity_in_stock, reorder_level, unit_price, expiry_date');

    if (medications) {
      const lowStock = medications.filter(m => m.quantity_in_stock <= m.reorder_level).length;
      const expiringSoon = medications.filter(m =>
        m.expiry_date && new Date(m.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length;
      const totalValue = medications.reduce((sum, m) => sum + (m.quantity_in_stock * m.unit_price), 0);

      const { count: pendingCount } = await supabase
        .from('prescriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalMedications: medications.length,
        lowStockCount: lowStock,
        expiringSoon,
        pendingPrescriptions: pendingCount || 0,
        totalValue
      });
    }
  }

  async function dispensePrescription(prescriptionId: string) {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          status: 'dispensed',
          dispensed_by: profile?.id,
          dispensed_at: new Date().toISOString()
        })
        .eq('id', prescriptionId);

      if (error) throw error;

      showToast('Ordonnance dispensée avec succès', 'success');
      fetchData();
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      showToast('Erreur lors de la dispensation', 'error');
    }
  }

  function exportToCSV() {
    const headers = ['Nom', 'Catégorie', 'Stock', 'Niveau de réapprovisionnement', 'Prix unitaire', 'Fournisseur', 'Date d\'expiration'];
    const rows = filteredMedications.map(m => [
      m.generic_name,
      m.category || '',
      m.quantity_in_stock,
      m.reorder_level,
      m.unit_price,
      m.supplier || '',
      m.expiry_date ? new Date(m.expiry_date).toLocaleDateString('fr-FR') : ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicaments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const filteredMedications = medications.filter(medication => {
    const matchesSearch = medication.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medication.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medication.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowStock || (medication.quantity_in_stock <= medication.reorder_level);
    return matchesSearch && matchesLowStock;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacie</h1>
          <p className="text-gray-600 mt-2">Gérer l'inventaire et les prescriptions</p>
        </div>
        <div className="flex gap-3">
          <ButtonWithPermission
            hasPermission={permissions.canExport}
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            tooltip="L'export est réservé au personnel autorisé"
            hideWhenNoPermission={false}
          >
            <Download className="w-4 h-4" />
            Exporter
          </ButtonWithPermission>
          <ButtonWithPermission
            hasPermission={permissions.canCreate}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            tooltip="Seul le personnel de pharmacie peut ajouter des médicaments"
            hideWhenNoPermission={false}
          >
            <Plus className="w-4 h-4" />
            Ajouter Médicament
          </ButtonWithPermission>
        </div>
      </div>

      {permissions.isReadOnly && (
        <ReadOnlyBadge message="Mode Consultation - Vous pouvez consulter les stocks et ordonnances mais pas les modifier" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Médicaments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMedications}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiration</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.expiringSoon}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.pendingPrescriptions}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur Stock</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                ${stats.totalValue.toFixed(0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {stats.lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {stats.lowStockCount} médicament{stats.lowStockCount > 1 ? 's' : ''} en rupture de stock ou niveau bas
            </p>
            <button
              onClick={() => {
                setShowLowStock(!showLowStock);
                setActiveTab('inventory');
              }}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              {showLowStock ? 'Afficher tous' : 'Voir les articles'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventaire ({stats.totalMedications})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'prescriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Ordonnances en attente ({stats.pendingPrescriptions})
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'inventory' && (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, catégorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau alerte</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMedications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Aucun médicament trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMedications.map((medication) => {
                      const isLowStock = medication.quantity_in_stock <= medication.reorder_level;
                      const isExpiringSoon = medication.expiry_date &&
                        new Date(medication.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      return (
                        <tr key={medication.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div>
                              <div>{medication.generic_name}</div>
                              {medication.brand_name && (
                                <div className="text-xs text-gray-500">{medication.brand_name}</div>
                              )}
                              {medication.is_controlled_substance && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                  Contrôlé
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {medication.category || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                              {medication.quantity_in_stock} {medication.dosage_form}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {medication.reorder_level}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ${medication.unit_price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {medication.supplier || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {medication.expiry_date ? (
                              <span className={isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                                {new Date(medication.expiry_date).toLocaleDateString('fr-FR')}
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              Voir
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'prescriptions' && (
          <div className="p-6">
            {pendingPrescriptions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune ordonnance en attente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono font-semibold text-gray-900">
                            {prescription.prescription_number}
                          </span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            En attente
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-600">Patient</div>
                            <div className="font-medium text-gray-900">
                              {prescription.patient?.first_name} {prescription.patient?.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {prescription.patient?.patient_number}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Prescripteur</div>
                            <div className="font-medium text-gray-900">
                              Dr. {prescription.doctor?.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(prescription.prescription_date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>

                        {prescription.items && prescription.items.length > 0 && (
                          <div className="bg-gray-50 rounded p-3 mb-3">
                            <div className="text-xs font-medium text-gray-700 mb-2">
                              Médicaments ({prescription.items.length})
                            </div>
                            <div className="space-y-1">
                              {prescription.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="text-sm text-gray-900">
                                  • {item.medication_name} - {item.dosage} ({item.quantity})
                                </div>
                              ))}
                              {prescription.items.length > 3 && (
                                <div className="text-sm text-gray-500">
                                  +{prescription.items.length - 3} autre(s)
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <ButtonWithPermission
                          hasPermission={permissions.canEdit}
                          onClick={() => dispensePrescription(prescription.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          tooltip="Seul le personnel de pharmacie peut dispenser les ordonnances"
                          hideWhenNoPermission={false}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Dispenser
                        </ButtonWithPermission>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddMedicationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
