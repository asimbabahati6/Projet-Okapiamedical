import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, AlertTriangle, DollarSign, FileText,
  Calendar, TrendingUp, Package, Play,
  Stethoscope, FlaskConical, Pill,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { DashboardKPIs } from '../../types/drcClinic';
import { formatCDF, formatUSD } from '../../utils/payrollCalculations';

export function DRCDashboard() {
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<DashboardKPIs>({
    daily_patients: 0,
    staff_on_duty: 0,
    critical_stock_alerts: 0,
    monthly_revenue_cdf: 0,
    monthly_revenue_usd: 0,
    contracts_expiring_30_days: 0,
    medications_expiring_soon: 0,
  });
  const [exchangeRate, setExchangeRate] = useState<{ usd_to_cdf: number; cdf_to_usd: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('is_active', true)
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rateData) {
        setExchangeRate({ usd_to_cdf: rateData.usd_to_cdf, cdf_to_usd: rateData.cdf_to_usd });
      }

      const today = new Date().toISOString().split('T')[0];

      const { count: patientCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', today)
        .lte('appointment_date', today);

      const { count: staffCount } = await supabase
        .from('shift_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('shift_date', today)
        .eq('status', 'confirmed');

      const { count: alertsCount } = await supabase
        .from('medication_stock_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false)
        .in('severity', ['high', 'critical']);

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { count: contractsCount } = await supabase
        .from('employee_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('contract_status', 'active')
        .not('end_date', 'is', null)
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('end_date', today);

      const { count: medicationsCount } = await supabase
        .from('medication_batches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'paid');

      const monthlyRevenueCDF = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const monthlyRevenueUSD = rateData ? monthlyRevenueCDF * rateData.cdf_to_usd : 0;

      setKpis({
        daily_patients: patientCount || 0,
        staff_on_duty: staffCount || 0,
        critical_stock_alerts: alertsCount || 0,
        monthly_revenue_cdf: monthlyRevenueCDF,
        monthly_revenue_usd: monthlyRevenueUSD,
        contracts_expiring_30_days: contractsCount || 0,
        medications_expiring_soon: medicationsCount || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord</h1>
        <p className="text-gray-600">Vue d'ensemble de la clinique médicale</p>
      </div>

      {/* Exchange Rate Banner */}
      {exchangeRate && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              <div>
                <p className="text-sm font-medium opacity-90">Taux de Change du Jour</p>
                <p className="text-2xl font-bold">1 USD = {exchangeRate.usd_to_cdf.toLocaleString()} CDF</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/tableau-de-bord/exchange-rates')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Gérer
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{kpis.daily_patients}</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Patients Aujourd'hui</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{kpis.staff_on_duty}</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Personnel de Garde</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatCDF(kpis.monthly_revenue_cdf)}</p>
              <p className="text-xs text-gray-500">{formatUSD(kpis.monthly_revenue_usd)}</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Revenu Mensuel</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{kpis.critical_stock_alerts}</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Alertes Critiques</p>
        </div>
      </div>

      {/* HR Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Contrats à Échoir</h3>
              <p className="text-sm text-gray-600">Expire dans les 30 prochains jours</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-orange-600">{kpis.contracts_expiring_30_days}</span>
            <button
              onClick={() => navigate('/tableau-de-bord/contracts')}
              className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Voir les Contrats
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Médicaments à Péremption</h3>
              <p className="text-sm text-gray-600">Expire dans les 30 prochains jours</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-blue-600">{kpis.medications_expiring_soon}</span>
            <button
              onClick={() => navigate('/tableau-de-bord/pharmacy-inventory')}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Voir l'Inventaire
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Pôle Médical — quick-access section                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="bg-blue-100 w-8 h-8 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Pôle Médical</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Médecin */}
          <button
            onClick={() => navigate('/staff/consultations')}
            className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors group"
          >
            <Stethoscope className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-gray-900">Médecin</p>
            <p className="text-xs text-gray-500 mt-0.5">Consultations</p>
          </button>

          {/* Labo */}
          <button
            onClick={() => navigate('/staff/laboratory')}
            className="p-4 bg-emerald-50 rounded-lg text-left hover:bg-emerald-100 transition-colors group"
          >
            <FlaskConical className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-gray-900">Labo</p>
            <p className="text-xs text-gray-500 mt-0.5">Analyses & Examens</p>
          </button>

          {/* Pharmacie */}
          <button
            onClick={() => navigate('/staff/pharmacy')}
            className="p-4 bg-orange-50 rounded-lg text-left hover:bg-orange-100 transition-colors group"
          >
            <Pill className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-gray-900">Pharmacie</p>
            <p className="text-xs text-gray-500 mt-0.5">Ordonnances & Stock</p>
          </button>
        </div>
      </div>

      {/* Actions Rapides (administrative) */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => navigate('/tableau-de-bord/employees')}
            className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors group"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-gray-900">Employés</p>
          </button>
          <button
            onClick={() => navigate('/tableau-de-bord/payroll')}
            className="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors group"
          >
            <DollarSign className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-gray-900">Paie</p>
          </button>
          <button
            onClick={() => navigate('/tableau-de-bord/shifts')}
            className="p-4 bg-teal-50 rounded-lg text-left hover:bg-teal-100 transition-colors group"
          >
            <Calendar className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-gray-900">Horaires</p>
          </button>
          <button
            onClick={() => navigate('/tableau-de-bord/insurance')}
            className="p-4 bg-orange-50 rounded-lg text-left hover:bg-orange-100 transition-colors group"
          >
            <FileText className="w-6 h-6 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-gray-900">Assurances</p>
          </button>
          <button
            onClick={() => navigate('/demo')}
            className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg text-left hover:from-blue-700 hover:to-cyan-700 transition-all group shadow-sm"
          >
            <Play className="w-6 h-6 text-white mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Démo Workflow</p>
            <p className="text-xs text-blue-100 mt-0.5">Médecin → Labo → Pharmacie</p>
          </button>
        </div>
      </div>

      {/* System status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Système Opérationnel</h2>
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
          <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Tous les systèmes fonctionnent normalement</p>
            <p className="text-xs text-gray-600">Dernière vérification: Aujourd'hui</p>
          </div>
        </div>
      </div>
    </div>
  );
}
