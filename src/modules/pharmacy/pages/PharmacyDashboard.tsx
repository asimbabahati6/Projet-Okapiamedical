import { useState, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';

interface DashboardStats {
  totalMedications: number;
  lowStockCount: number;
  expiringSoon: number;
  pendingPrescriptions: number;
  totalValue: number;
  dispensedToday: number;
  urgentOrders: number;
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
  const [stats, setStats] = useState<DashboardStats>({
    totalMedications: 0,
    lowStockCount: 0,
    expiringSoon: 0,
    pendingPrescriptions: 0,
    totalValue: 0,
    dispensedToday: 0,
    urgentOrders: 0
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState<RecentPrescription[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentPrescriptions()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const { data: medications, error: medError } = await supabase
        .from('medications')
        .select('quantity_in_stock, reorder_level, unit_price, expiry_date');

      if (medError) throw medError;

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const lowStock = medications?.filter(m => m.quantity_in_stock <= m.reorder_level).length || 0;
      const expiring = medications?.filter(m => {
        const expiryDate = new Date(m.expiry_date);
        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
      }).length || 0;

      const totalValue = medications?.reduce((sum, m) => sum + (m.quantity_in_stock * m.unit_price), 0) || 0;

      const { count: pendingCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const today = new Date().toISOString().split('T')[0];
      const { count: dispensedCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dispensed')
        .gte('updated_at', today);

      const { count: urgentCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('is_urgent', true);

      setStats({
        totalMedications: medications?.length || 0,
        lowStockCount: lowStock,
        expiringSoon: expiring,
        pendingPrescriptions: pendingCount || 0,
        totalValue: totalValue,
        dispensedToday: dispensedCount || 0,
        urgentOrders: urgentCount || 0
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
          items:prescription_items(count)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formatted = data?.map(p => ({
        id: p.id,
        prescription_number: p.prescription_number,
        patient_name: p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : 'N/A',
        status: p.status,
        created_at: p.created_at,
        item_count: Array.isArray(p.items) ? p.items.length : 0
      })) || [];

      setRecentPrescriptions(formatted);
    } catch (error) {
      console.error('Error fetching recent prescriptions:', error);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      dispensed: { label: 'Dispensée', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
      partial: { label: 'Partielle', color: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord - Pharmacie</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de l'activité pharmaceutique</p>
      </div>

      {stats.lowStockCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <p className="font-medium text-red-800">
                Attention: {stats.lowStockCount} médicament(s) en stock bas
              </p>
              <button
                onClick={() => navigate('/pharmacy/inventory')}
                className="text-sm text-red-600 hover:text-red-700 underline mt-1"
              >
                Voir les médicaments concernés →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <h3 className="text-2xl font-bold">{stats.totalMedications}</h3>
          <p className="text-blue-100 mt-1">Médicaments Total</p>
          <button
            onClick={() => navigate('/pharmacy/inventory')}
            className="mt-4 text-sm text-blue-100 hover:text-white flex items-center"
          >
            Voir inventaire <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-2xl font-bold">{stats.lowStockCount}</h3>
          <p className="text-red-100 mt-1">Stock Bas</p>
          <button
            onClick={() => navigate('/pharmacy/inventory')}
            className="mt-4 text-sm text-red-100 hover:text-white flex items-center"
          >
            Gérer les stocks <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-2xl font-bold">{stats.expiringSoon}</h3>
          <p className="text-orange-100 mt-1">Expiration Prochaine</p>
          <p className="text-xs text-orange-200 mt-2">Dans les 30 prochains jours</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            {stats.urgentOrders > 0 && (
              <span className="bg-white text-purple-600 text-xs font-bold px-2 py-1 rounded-full">
                {stats.urgentOrders} urgent
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold">{stats.pendingPrescriptions}</h3>
          <p className="text-purple-100 mt-1">Ordonnances en Attente</p>
          <button
            onClick={() => navigate('/staff/prescriptions')}
            className="mt-4 text-sm text-purple-100 hover:text-white flex items-center"
          >
            Traiter les ordonnances <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</h3>
          <p className="text-green-100 mt-1">Valeur du Stock</p>
          <p className="text-xs text-green-200 mt-2">Inventaire total</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-2xl font-bold">{stats.dispensedToday}</h3>
          <p className="text-teal-100 mt-1">Dispensées Aujourd'hui</p>
          <p className="text-xs text-teal-200 mt-2">Ordonnances traitées</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-2xl font-bold">{stats.lowStockCount}</h3>
          <p className="text-cyan-100 mt-1">Commandes à Passer</p>
          <p className="text-xs text-cyan-200 mt-2">Réapprovisionnement nécessaire</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-2xl font-bold">98%</h3>
          <p className="text-indigo-100 mt-1">Taux de Service</p>
          <p className="text-xs text-indigo-200 mt-2">Ce mois-ci</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ordonnances Récentes</h2>
            <button
              onClick={() => navigate('/staff/prescriptions')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir tout →
            </button>
          </div>

          {recentPrescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune ordonnance récente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">N° Ordonnance</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Articles</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentPrescriptions.map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {prescription.prescription_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{prescription.patient_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{prescription.item_count} article(s)</td>
                      <td className="py-3 px-4">{getStatusBadge(prescription.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(prescription.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate('/staff/prescriptions')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/pharmacy/inventory')}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Gérer l'Inventaire
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/staff/prescriptions')}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Traiter Ordonnances
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/pharmacy/inventory')}
              className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Stock Bas
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">Performance du Mois</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ordonnances traitées</span>
                <span className="font-semibold text-gray-900">{stats.dispensedToday * 20}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux de satisfaction</span>
                <span className="font-semibold text-green-600">98%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Temps moyen traitement</span>
                <span className="font-semibold text-blue-600">8 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
