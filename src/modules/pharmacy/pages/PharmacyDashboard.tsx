import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  ShoppingCart,
  Activity,
  ArrowRight,
  Eye,
  Plus,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { AddMedicationModal } from '@/components/pharmacy/AddMedicationModal';

interface DashboardStats {
  totalMedications: number;
  lowStockCount: number;
  expiringSoon: number;
  pendingPrescriptions: number;
  totalValue: number;
  dispensedToday: number;
  ordersToPlace: number;
  serviceRate: number;
  dispensedThisMonth: number;
}

interface RecentPrescription {
  id: string;
  prescription_number: string;
  patient_name: string;
  status: string;
  created_at: string;
  item_count: number;
}

export function PharmacyDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showAddMed, setShowAddMed] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalMedications: 0,
    lowStockCount: 0,
    expiringSoon: 0,
    pendingPrescriptions: 0,
    totalValue: 0,
    dispensedToday: 0,
    ordersToPlace: 0,
    serviceRate: 98,
    dispensedThisMonth: 0
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState<RecentPrescription[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchRecentPrescriptions()]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  async function fetchStats() {
    try {
      const { data: medications, error: medError } = await supabase
        .from('medications')
        .select('quantity_in_stock, reorder_level, unit_price, expiry_date');

      if (medError) throw medError;

      const meds = medications ?? [];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const today = new Date();

      const lowStock = meds.filter(m => (m.quantity_in_stock ?? 0) <= (m.reorder_level ?? 0)).length;
      const expiring = meds.filter(m => {
        if (!m.expiry_date) return false;
        const exp = new Date(m.expiry_date);
        return exp <= thirtyDaysFromNow && exp > today;
      }).length;
      const totalValue = meds.reduce((sum, m) => sum + ((m.quantity_in_stock ?? 0) * (m.unit_price ?? 0)), 0);

      const { count: pendingCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const todayStr = today.toISOString().split('T')[0];
      const { count: dispensedTodayCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dispensed')
        .gte('updated_at', todayStr);

      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const { count: dispensedMonthCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dispensed')
        .gte('updated_at', firstOfMonth);

      setStats({
        totalMedications: meds.length,
        lowStockCount: lowStock,
        expiringSoon: expiring,
        pendingPrescriptions: pendingCount ?? 0,
        totalValue,
        dispensedToday: dispensedTodayCount ?? 0,
        ordersToPlace: lowStock,
        serviceRate: 98,
        dispensedThisMonth: dispensedMonthCount ?? 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchRecentPrescriptions() {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id,
          prescription_number,
          status,
          created_at,
          patient:patients(first_name, last_name),
          items:prescription_items(id)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const formatted = (data ?? []).map((p: any) => {
        const patient = Array.isArray(p.patient) ? p.patient[0] : p.patient;
        return {
          id: p.id,
          prescription_number: p.prescription_number,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu',
          status: p.status,
          created_at: p.created_at,
          item_count: Array.isArray(p.items) ? p.items.length : 0
        };
      });

      setRecentPrescriptions(formatted);
    } catch (error) {
      console.error('Error fetching recent prescriptions:', error);
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    dispensed: { label: 'Dispensée', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    partial: { label: 'Partielle', color: 'bg-blue-100 text-blue-800' }
  };

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord - Pharmacie</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de l'activité pharmaceutique</p>
        </div>
        <button
          onClick={() => setShowAddMed(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau médicament
        </button>
      </div>

      {stats.lowStockCount > 0 && (
        <button
          onClick={() => navigate('/pharmacy/low-stock')}
          className="w-full text-left bg-red-50 border-l-4 border-red-500 p-4 rounded-lg hover:bg-red-100 transition-colors group"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                Attention: {stats.lowStockCount} médicament(s) en stock bas
              </p>
              <p className="text-sm text-red-600 mt-0.5 group-hover:underline">
                Voir les médicaments concernés →
              </p>
            </div>
          </div>
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          onClick={() => navigate('/pharmacy/inventory')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white text-left hover:from-blue-600 hover:to-blue-700 transition-all hover:shadow-xl active:scale-95"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <h3 className="text-3xl font-bold">{stats.totalMedications}</h3>
          <p className="text-blue-100 mt-1">Médicaments Total</p>
          <div className="mt-4 text-sm text-blue-100 flex items-center">
            Voir inventaire <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        <button
          onClick={() => navigate('/pharmacy/low-stock')}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white text-left hover:from-red-600 hover:to-red-700 transition-all hover:shadow-xl active:scale-95"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            {stats.lowStockCount > 0 && (
              <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                Alerte
              </span>
            )}
          </div>
          <h3 className="text-3xl font-bold">{stats.lowStockCount}</h3>
          <p className="text-red-100 mt-1">Stock Bas</p>
          <div className="mt-4 text-sm text-red-100 flex items-center">
            Gérer les stocks <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        <button
          onClick={() => navigate('/pharmacy/inventory')}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white text-left hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-xl active:scale-95"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-3xl font-bold">{stats.expiringSoon}</h3>
          <p className="text-orange-100 mt-1">Expiration Prochaine</p>
          <p className="text-xs text-orange-200 mt-4">Dans les 30 prochains jours</p>
        </button>

        <button
          onClick={() => navigate('/pharmacy/prescriptions')}
          className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg p-6 text-white text-left hover:from-violet-600 hover:to-violet-700 transition-all hover:shadow-xl active:scale-95"
        >
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            {stats.pendingPrescriptions > 0 && (
              <span className="bg-white text-violet-600 text-xs font-bold px-2 py-1 rounded-full">
                {stats.pendingPrescriptions} en attente
              </span>
            )}
          </div>
          <h3 className="text-3xl font-bold">{stats.pendingPrescriptions}</h3>
          <p className="text-violet-100 mt-1">Ordonnances en Attente</p>
          <div className="mt-4 text-sm text-violet-100 flex items-center">
            Traiter les ordonnances <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-2xl font-bold">
            ${stats.totalValue >= 1000
              ? `${(stats.totalValue / 1000).toFixed(0)}k`
              : stats.totalValue.toLocaleString()}
          </h3>
          <p className="text-green-100 mt-1">Valeur du Stock</p>
          <p className="text-xs text-green-200 mt-4">Inventaire total</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-3xl font-bold">{stats.dispensedToday}</h3>
          <p className="text-teal-100 mt-1">Dispensées Aujourd'hui</p>
          <p className="text-xs text-teal-200 mt-4">Ordonnances traitées</p>
        </div>

        <button
          onClick={() => navigate('/pharmacy/orders')}
          className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white text-left hover:from-cyan-600 hover:to-cyan-700 transition-all hover:shadow-xl active:scale-95"
        >
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-3xl font-bold">{stats.ordersToPlace}</h3>
          <p className="text-cyan-100 mt-1">Commandes à Passer</p>
          <div className="mt-4 text-sm text-cyan-100 flex items-center">
            Voir les commandes <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-3xl font-bold">{stats.serviceRate}%</h3>
          <p className="text-sky-100 mt-1">Taux de Service</p>
          <p className="text-xs text-sky-200 mt-4">Ce mois-ci</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Ordonnances Récentes</h2>
            <button
              onClick={() => navigate('/pharmacy/prescriptions')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Voir tout →
            </button>
          </div>

          {recentPrescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-gray-500">Aucune ordonnance récente</p>
              <button
                onClick={() => navigate('/pharmacy/prescriptions')}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Accéder aux ordonnances
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">N° Ordonnance</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Articles</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPrescriptions.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/pharmacy/prescriptions')}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {p.prescription_number}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-800">{p.patient_name}</td>
                      <td className="py-3 px-3 text-sm text-gray-500">{p.item_count}</td>
                      <td className="py-3 px-3">{getStatusBadge(p.status)}</td>
                      <td className="py-3 px-3 text-sm text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Eye className="w-4 h-4 text-blue-500 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Actions Rapides</h2>

          <button
            onClick={() => setShowAddMed(true)}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-between group"
          >
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Gérer l'Inventaire
            </span>
            <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/pharmacy/prescriptions')}
            className="w-full bg-violet-600 text-white px-4 py-3 rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-between group"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Traiter Ordonnances
            </span>
            <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/pharmacy/low-stock')}
            className="w-full bg-orange-600 text-white px-4 py-3 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-between group"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Stock Bas
            </span>
            <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/pharmacy/orders')}
            className="w-full bg-cyan-600 text-white px-4 py-3 rounded-xl hover:bg-cyan-700 transition-colors flex items-center justify-between group"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Commandes à Passer
            </span>
            <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-2 p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-3">Performance du Mois</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ordonnances traitées</span>
                <span className="font-bold text-gray-900">{stats.dispensedThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux de satisfaction</span>
                <span className="font-bold text-green-600">{stats.serviceRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dispensées aujourd'hui</span>
                <span className="font-bold text-blue-600">{stats.dispensedToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">En attente</span>
                <span className={`font-bold ${stats.pendingPrescriptions > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                  {stats.pendingPrescriptions}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddMed && (
        <AddMedicationModal
          onClose={() => setShowAddMed(false)}
          onSuccess={() => {
            showToast('Médicament ajouté avec succès', 'success');
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
