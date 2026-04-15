import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Search, Plus, CreditCard, Banknote, Smartphone, FileText, AlertCircle, CheckCircle, FileCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types/database';
import { AddInvoiceModal } from '../../components/billing/AddInvoiceModal';
import { InvoiceDetailsModal } from '../../components/billing/InvoiceDetailsModal';
import { InvoiceStatusBadge } from '../../components/billing/InvoiceStatusBadge';
import { InvoiceActionsMenu } from '../../components/billing/InvoiceActionsMenu';
import { EncaisserModal } from '../../components/billing/EncaisserModal';
import { PromoteDraftModal } from '../../components/billing/PromoteDraftModal';
import { PeriodFilterBar } from '../../components/billing/PeriodFilterBar';
import { EnhancedBillingKPICard } from '../../components/billing/EnhancedBillingKPICard';
import { BillingTrendMiniChart } from '../../components/billing/BillingTrendMiniChart';
import { BillingQuickStats } from '../../components/billing/BillingQuickStats';
import { BillingInsightsBanner } from '../../components/billing/BillingInsightsBanner';
import { ExportDropdownMenu } from '../../components/billing/ExportDropdownMenu';
import { ReportInsertModal, InsertOptions } from '../../components/billing/ReportInsertModal';
import { ReportSummaryCard } from '../../components/billing/ReportSummaryCard';
import { FinancialReportsSection } from '../../components/billing/FinancialReportsSection';
import { SavedFinancialReport } from '../../types/financialReport';
import {
  filterInvoicesByPeriod,
  comparePeriods,
  getPeriodLabel,
  getPreviousPeriodRange,
  getLast7DaysData,
  PeriodFilter
} from '../../utils/billingPeriodFilters';

export function BillingPage() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEncaisserModal, setShowEncaisserModal] = useState(false);
  const [showPromoteDraftModal, setShowPromoteDraftModal] = useState(false);
  const [showReportInsertModal, setShowReportInsertModal] = useState(false);
  const [insertedReports, setInsertedReports] = useState<SavedFinancialReport[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, patient:patients(*)`)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setAllInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      generateMockInvoices();
    } finally {
      setLoading(false);
    }
  }

  function generateMockInvoices() {
    const statuses: Array<Invoice['status'] | 'draft'> = ['draft', 'pending', 'partial', 'paid', 'cancelled'];
    const paymentMethods = ['Espèces', 'Carte bancaire', 'Mobile Money', 'Assurance'];
    const mockPatients = [
      { first_name: 'Jean', last_name: 'Dupont' },
      { first_name: 'Marie', last_name: 'Koffi' },
      { first_name: 'Paul', last_name: 'Mbala' },
      { first_name: 'Sophie', last_name: 'Lukeni' },
      { first_name: 'André', last_name: 'Kabila' },
      { first_name: 'Claire', last_name: 'Tshisekedi' },
      { first_name: 'David', last_name: 'Lumumba' },
      { first_name: 'Emma', last_name: 'Mobutu' },
    ];

    const mockData: Invoice[] = [];
    const today = new Date();

    for (let i = 0; i < 45; i++) {
      const daysOffset = Math.floor(Math.random() * 90) - 45;
      const invoiceDate = new Date(today);
      invoiceDate.setDate(today.getDate() + daysOffset);

      const patient = mockPatients[Math.floor(Math.random() * mockPatients.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)] as Invoice['status'];
      const totalAmount = 50 + Math.floor(Math.random() * 500);
      const tvaAmount = totalAmount * 0.16;
      const netToPay = totalAmount + tvaAmount;
      let paidAmount = 0;

      if (status === 'paid') {
        paidAmount = netToPay;
      } else if (status === 'partial') {
        paidAmount = Math.floor(netToPay * (0.3 + Math.random() * 0.5));
      }

      const balance = netToPay - paidAmount;
      const paymentMethod = status !== 'pending' && status !== 'draft' ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : null;

      mockData.push({
        id: `invoice-${i}`,
        invoice_number: status === 'draft' ? null : `OKA-2026-04-${String(1 + i).padStart(4, '0')}`,
        patient_id: `patient-${i}`,
        consultation_id: null,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance: balance,
        status,
        payment_method: paymentMethod,
        payment_date: status === 'paid' ? invoiceDate.toISOString() : null,
        notes: null,
        created_by: null,
        created_at: invoiceDate.toISOString(),
        updated_at: invoiceDate.toISOString(),
        tva_rate: 16,
        tva_amount: tvaAmount,
        net_to_pay: netToPay,
        draft_number: status === 'draft' ? `DRAFT-${1000 + i}` : null,
        patient: {
          ...patient,
          id: `patient-${i}`,
          patient_number: `PAT${String(1000 + i).padStart(6, '0')}`,
          date_of_birth: '1990-01-01',
          gender: Math.random() < 0.5 ? 'M' : 'F',
          blood_group: 'O+',
          phone: `+243 81${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
          email: `${patient.first_name.toLowerCase()}@email.com`,
          address: 'Kinshasa, RDC',
          city: 'Kinshasa',
          emergency_contact_name: null,
          emergency_contact_phone: null,
          emergency_contact_relationship: null,
          insurance_provider: null,
          insurance_number: null,
          allergies: null,
          chronic_conditions: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      } as any);
    }

    setAllInvoices(mockData);
  }

  const filteredByPeriod = useMemo(() => {
    const customRange = customStartDate && customEndDate ? {
      start: new Date(customStartDate),
      end: new Date(customEndDate)
    } : undefined;
    return filterInvoicesByPeriod(allInvoices, selectedPeriod, customRange);
  }, [allInvoices, selectedPeriod, customStartDate, customEndDate]);

  const filteredInvoices = useMemo(() => {
    return filteredByPeriod.filter(invoice => {
      const invoiceNum = (invoice.invoice_number ?? (invoice as any).draft_number ?? '').toLowerCase();
      const matchesSearch =
        invoiceNum.includes(searchTerm.toLowerCase()) ||
        `${invoice.patient?.first_name} ${invoice.patient?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [filteredByPeriod, searchTerm, statusFilter]);

  const periodComparison = useMemo(() => {
    const prevRange = getPreviousPeriodRange(selectedPeriod);
    const prevInvoices = allInvoices.filter(inv => {
      const date = new Date(inv.created_at);
      return date >= prevRange.start && date <= prevRange.end;
    });
    return comparePeriods(filteredByPeriod, prevInvoices);
  }, [filteredByPeriod, allInvoices, selectedPeriod]);

  const stats = useMemo(() => {
    return {
      totalPending: filteredByPeriod.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.balance, 0),
      totalCollectedToday: filteredByPeriod
        .filter(i => i.payment_date && new Date(i.payment_date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0])
        .reduce((sum, i) => sum + i.paid_amount, 0),
      outstandingBalance: filteredByPeriod.filter(i => i.status !== 'draft').reduce((sum, i) => sum + i.balance, 0),
      totalPaid: filteredByPeriod.filter(i => i.status === 'paid').length,
      totalDrafts: filteredByPeriod.filter(i => i.status === 'draft').length,
    };
  }, [filteredByPeriod]);

  const quickStats = useMemo(() => {
    const today = filterInvoicesByPeriod(allInvoices, 'today');
    const week = filterInvoicesByPeriod(allInvoices, 'week');
    const month = filterInvoicesByPeriod(allInvoices, 'month');

    const calcStats = (invs: Invoice[]) => {
      const nonDraft = invs.filter(i => i.status !== 'draft');
      const totalInvoiced = nonDraft.reduce((sum, inv) => sum + inv.total_amount, 0);
      const totalCollected = nonDraft.reduce((sum, inv) => sum + inv.paid_amount, 0);
      return {
        count: nonDraft.length,
        totalCollected,
        recoveryRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0
      };
    };

    return {
      today: calcStats(today),
      week: calcStats(week),
      month: calcStats(month)
    };
  }, [allInvoices]);

  const trendData = useMemo(() => getLast7DaysData(filteredByPeriod), [filteredByPeriod]);

  const insights = useMemo(() => {
    const list = [];
    const change = periodComparison.changes.totalCollected;

    if (change > 15) {
      list.push({ type: 'success' as const, icon: 'trending-up' as const, message: `Collections en hausse de ${change.toFixed(1)}% cette période` });
    } else if (change < -10) {
      list.push({ type: 'warning' as const, icon: 'trending-down' as const, message: `Collections en baisse de ${Math.abs(change).toFixed(1)}%` });
    }

    const overdue = filteredByPeriod.filter(inv => {
      if (['paid', 'cancelled', 'draft'].includes(inv.status)) return false;
      return (Date.now() - new Date(inv.created_at).getTime()) / (1000 * 60 * 60 * 24) > 30;
    }).length;

    if (overdue > 0) {
      list.push({ type: overdue > 5 ? 'danger' as const : 'warning' as const, icon: 'alert' as const, message: `${overdue} facture${overdue > 1 ? 's' : ''} en retard de plus de 30 jours` });
    }

    if (stats.totalDrafts > 0) {
      list.push({ type: 'info' as const, icon: 'alert' as const, message: `${stats.totalDrafts} brouillon${stats.totalDrafts > 1 ? 's' : ''} en attente de validation` });
    }

    const recoveryRate = periodComparison.current.recoveryRate;
    if (recoveryRate >= 85) {
      list.push({ type: 'success' as const, icon: 'check' as const, message: `Excellent taux de recouvrement: ${recoveryRate.toFixed(1)}%` });
    } else if (recoveryRate < 70) {
      list.push({ type: 'warning' as const, icon: 'alert' as const, message: `Taux de recouvrement à améliorer: ${recoveryRate.toFixed(1)}%` });
    }

    return list;
  }, [periodComparison, filteredByPeriod, stats.totalDrafts]);

  function formatCurrency(amount: number) {
    return `${amount.toFixed(2)} USD`;
  }

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const handleInsertReport = async (reportId: string, options: InsertOptions) => {
    try {
      const { data: report, error } = await supabase
        .from('financial_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;

      if (report) {
        const { error: insertError } = await supabase
          .from('billing_financial_reports')
          .insert({
            billing_period_start: customStartDate || new Date().toISOString().split('T')[0],
            billing_period_end: customEndDate || new Date().toISOString().split('T')[0],
            financial_report_id: reportId,
            display_options: options,
            auto_update: options.autoUpdate
          });

        if (insertError && !insertError.message.includes('duplicate')) throw insertError;
        setInsertedReports([...insertedReports, report]);
      }
    } catch (error) {
      console.error('Error inserting report:', error);
    }
  };

  const handleRemoveReport = (reportId: string) => {
    setInsertedReports(insertedReports.filter(r => r.id !== reportId));
  };

  function openEncaisser(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setShowEncaisserModal(true);
  }

  function openPromoteDraft(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setShowPromoteDraftModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion de la Facturation</h1>
          <p className="text-gray-600">Gérer les factures et les paiements</p>
        </div>
        <div className="flex gap-3">
          <ExportDropdownMenu
            invoices={filteredInvoices}
            periodLabel={getPeriodLabel(selectedPeriod)}
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Facture
          </button>
        </div>
      </div>

      <PeriodFilterBar
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={handleCustomDateChange}
        invoiceCount={filteredByPeriod.length}
      />

      <FinancialReportsSection
        onReportLinked={(reportId) => {
          fetchInvoices();
          const report = insertedReports.find(r => r.id === reportId);
          if (!report) {
            supabase.from('financial_reports').select('*').eq('id', reportId).single()
              .then(({ data }) => { if (data) setInsertedReports([...insertedReports, data]); });
          }
        }}
        currentPeriod={{
          start: customStartDate || new Date().toISOString().split('T')[0],
          end: customEndDate || new Date().toISOString().split('T')[0]
        }}
      />

      {insertedReports.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Rapports Financiers Liés à Cette Période
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insertedReports.map(report => (
              <ReportSummaryCard key={report.id} report={report} onRemove={() => handleRemoveReport(report.id)} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <EnhancedBillingKPICard
          title="Factures en attente"
          value={formatCurrency(stats.totalPending)}
          icon={AlertCircle}
          color="yellow"
          change={periodComparison.changes.totalBalance}
          showTrend
        />
        <EnhancedBillingKPICard
          title="Collecté aujourd'hui"
          value={formatCurrency(stats.totalCollectedToday)}
          icon={DollarSign}
          color="green"
        />
        <EnhancedBillingKPICard
          title="Solde impayé"
          value={formatCurrency(stats.outstandingBalance)}
          icon={FileText}
          color="orange"
          change={periodComparison.changes.totalBalance}
          showTrend
        />
        <EnhancedBillingKPICard
          title="Factures payées"
          value={stats.totalPaid}
          icon={CheckCircle}
          color="blue"
          subtitle={`sur ${filteredByPeriod.filter(i => i.status !== 'draft').length} factures`}
        />
      </div>

      <BillingInsightsBanner insights={insights} />

      <BillingQuickStats
        todayStats={quickStats.today}
        weekStats={quickStats.week}
        monthStats={quickStats.month}
        onPeriodClick={(period) => setSelectedPeriod(period)}
      />

      {trendData.length > 0 && <BillingTrendMiniChart data={trendData} />}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro OKA, brouillon ou patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="pending">En attente</option>
            <option value="partial">Partiel</option>
            <option value="paid">Payée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de Paiement Acceptées</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Banknote className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Espèces</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Carte bancaire</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Smartphone className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">Mobile Money</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <FileText className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium text-gray-900">Assurance</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Facture</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">HT</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net à Payer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Solde</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const isDraft = invoice.status === 'draft';
                  const displayNumber = invoice.invoice_number ?? (invoice as any).draft_number ?? 'BROUILLON';
                  const netToPay = (invoice as any).net_to_pay ?? invoice.total_amount;

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isDraft ? (
                          <span className="text-sm font-mono text-gray-400 italic">{displayNumber}</span>
                        ) : (
                          <span className="text-sm font-semibold font-mono text-blue-700">{displayNumber}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {invoice.patient?.first_name} {invoice.patient?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{invoice.patient?.patient_number}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-700">{formatCurrency(invoice.total_amount)}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(netToPay)}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        {isDraft ? (
                          <span className="text-sm text-gray-400">—</span>
                        ) : (
                          <span className={`text-sm font-medium ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(invoice.balance)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isDraft && (
                            <button
                              onClick={() => openPromoteDraft(invoice)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Valider le brouillon"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              Valider
                            </button>
                          )}
                          {(invoice.status === 'pending' || invoice.status === 'partial') && (
                            <button
                              onClick={() => openEncaisser(invoice)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Encaisser
                            </button>
                          )}
                          <InvoiceActionsMenu
                            invoice={invoice}
                            onView={() => {
                              setSelectedInvoice(invoice);
                              setShowDetailsModal(true);
                            }}
                          />
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

      {filteredInvoices.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Affichage de {filteredInvoices.length} sur {filteredByPeriod.length} factures
        </div>
      )}

      {showAddModal && (
        <AddInvoiceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { fetchInvoices(); setShowAddModal(false); }}
        />
      )}

      {showDetailsModal && selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => { setShowDetailsModal(false); setSelectedInvoice(null); }}
          onEncaisser={
            selectedInvoice.status === 'pending' || selectedInvoice.status === 'partial'
              ? () => { setShowDetailsModal(false); setShowEncaisserModal(true); }
              : undefined
          }
          onPromoteDraft={
            selectedInvoice.status === 'draft'
              ? () => { setShowDetailsModal(false); setShowPromoteDraftModal(true); }
              : undefined
          }
          onPayment={async (invoiceId, amount, method) => {
            try {
              const { error } = await supabase
                .from('invoices')
                .update({
                  paid_amount: amount,
                  balance: selectedInvoice.total_amount - amount,
                  status: amount >= selectedInvoice.total_amount ? 'paid' : 'partial',
                  payment_method: method,
                  payment_date: new Date().toISOString()
                })
                .eq('id', invoiceId);
              if (error) throw error;
              fetchInvoices();
              setShowDetailsModal(false);
              setSelectedInvoice(null);
            } catch (err) {
              console.error('Error processing payment:', err);
            }
          }}
        />
      )}

      {showEncaisserModal && selectedInvoice && (
        <EncaisserModal
          invoice={selectedInvoice}
          onClose={() => { setShowEncaisserModal(false); setSelectedInvoice(null); }}
          onSuccess={() => { fetchInvoices(); }}
        />
      )}

      {showPromoteDraftModal && selectedInvoice && (
        <PromoteDraftModal
          invoice={selectedInvoice}
          onClose={() => { setShowPromoteDraftModal(false); setSelectedInvoice(null); }}
          onSuccess={() => { fetchInvoices(); setShowPromoteDraftModal(false); setSelectedInvoice(null); }}
        />
      )}

      {showReportInsertModal && (
        <ReportInsertModal
          isOpen={showReportInsertModal}
          onClose={() => setShowReportInsertModal(false)}
          onInsert={handleInsertReport}
          currentPeriod={
            customStartDate && customEndDate
              ? { start: new Date(customStartDate), end: new Date(customEndDate) }
              : undefined
          }
        />
      )}
    </div>
  );
}
