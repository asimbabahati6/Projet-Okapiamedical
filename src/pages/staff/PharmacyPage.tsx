import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Search, Package, AlertTriangle, CheckCircle, Clock,
  Plus, Filter, Download, ArrowUpDown, ChevronDown,
  Calendar, DollarSign, ShieldAlert, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { PharmacyMedication } from '../../types/pharmacy';
import { getPharmacyStats, getExpiringMedications } from '../../services/pharmacyService';
import { AddMedicationModal } from '../../components/pharmacy/AddMedicationModal';

type StockFilter = 'all' | 'ok' | 'low' | 'rupture';
type SortField = 'name' | 'current_stock' | 'unit_price' | 'expiry_date' | 'category';

export function PharmacyPage() {
  const [medications, setMedications] = useState<PharmacyMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    total_medications: 0, low_stock_count: 0, out_of_stock_count: 0,
    expiring_soon_count: 0, total_stock_value: 0, dispensed_today: 0, total_categories: 0
  });
  const [expiringMeds, setExpiringMeds] = useState<PharmacyMedication[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [medsResult, statsResult, expiringResult] = await Promise.all([
        supabase.from('pharmacy_medications').select('*').eq('is_active', true).order('name'),
        getPharmacyStats(),
        getExpiringMedications(90)
      ]);

      if (medsResult.data) setMedications(medsResult.data);
      setStats(statsResult);
      setExpiringMeds(expiringResult);
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStockStatus(med: PharmacyMedication): 'ok' | 'low' | 'rupture' {
    if (med.current_stock === 0) return 'rupture';
    if (med.current_stock < med.minimum_stock) return 'low';
    return 'ok';
  }

  const categories = [...new Set(medications.map(m => m.category))].sort();

  const filtered = medications
    .filter(m => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!m.name.toLowerCase().includes(q) &&
            !(m.generic_name || '').toLowerCase().includes(q) &&
            !m.code.toLowerCase().includes(q)) return false;
      }
      if (stockFilter !== 'all' && getStockStatus(m) !== stockFilter) return false;
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'current_stock': cmp = a.current_stock - b.current_stock; break;
        case 'unit_price': cmp = a.unit_price - b.unit_price; break;
        case 'expiry_date': cmp = (a.expiry_date || '').localeCompare(b.expiry_date || ''); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
      }
      return sortAsc ? cmp : -cmp;
    });

  function handleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  }

  function exportCSV() {
    const headers = ['Code', 'Nom', 'Catégorie', 'Dosage', 'Forme', 'Stock', 'Min', 'Prix', 'Expiration'];
    const rows = filtered.map(m => [
      m.code, m.name, m.category, m.dosage, m.form,
      m.current_stock, m.minimum_stock, m.unit_price, m.expiry_date || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaire_pharmacie_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const categoryColors: Record<string, string> = {
    'Antibiotique': 'bg-red-50 text-red-700 border-red-200',
    'Antalgique': 'bg-orange-50 text-orange-700 border-orange-200',
    'Anti-inflammatoire': 'bg-amber-50 text-amber-700 border-amber-200',
    'Cardiovasculaire': 'bg-rose-50 text-rose-700 border-rose-200',
    'Antidiabétique': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Antiparasitaire': 'bg-lime-50 text-lime-700 border-lime-200',
    'Gastro-intestinal': 'bg-teal-50 text-teal-700 border-teal-200',
    'Respiratoire': 'bg-sky-50 text-sky-700 border-sky-200',
    'Vitamine': 'bg-green-50 text-green-700 border-green-200',
    'Dermatologie': 'bg-pink-50 text-pink-700 border-pink-200',
    'Neurologique': 'bg-slate-50 text-slate-700 border-slate-200',
    'Obstétrique': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    'Ophtalmologie': 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            Pharmacie
          </h1>
          <p className="text-gray-500 mt-1">Gestion du stock pharmaceutique</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total produits</p>
              <p className="text-xl font-bold text-gray-900">{loading ? '-' : stats.total_medications}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Stock bas</p>
              <p className="text-xl font-bold text-amber-600">{loading ? '-' : stats.low_stock_count}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Rupture</p>
              <p className="text-xl font-bold text-red-600">{loading ? '-' : stats.out_of_stock_count}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Valeur stock</p>
              <p className="text-xl font-bold text-gray-900">
                {loading ? '-' : `$${stats.total_stock_value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Expiring Alert Banner */}
      {expiringMeds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
        >
          <Calendar className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">
              {expiringMeds.length} médicament{expiringMeds.length > 1 ? 's' : ''} expirent dans les 90 prochains jours
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              {expiringMeds.slice(0, 3).map(m => m.name).join(', ')}
              {expiringMeds.length > 3 && ` et ${expiringMeds.length - 3} autre(s)`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, code ou DCI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                  showFilters ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtres
                {(stockFilter !== 'all' || categoryFilter !== 'all') && (
                  <span className="w-2 h-2 bg-teal-500 rounded-full" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-gray-100 flex flex-wrap gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Statut stock</label>
                    <div className="flex gap-1">
                      {([['all', 'Tous'], ['ok', 'OK'], ['low', 'Bas'], ['rupture', 'Rupture']] as const).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setStockFilter(val)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            stockFilter === val
                              ? 'bg-teal-100 text-teal-700 font-medium'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Catégorie</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {(stockFilter !== 'all' || categoryFilter !== 'all') && (
                    <button
                      onClick={() => { setStockFilter('all'); setCategoryFilter('all'); }}
                      className="self-end px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Count */}
        <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {filtered.length} médicament{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ArrowUpDown className="w-3 h-3" />
            Trié par {sortField === 'name' ? 'nom' : sortField === 'current_stock' ? 'stock' : sortField === 'unit_price' ? 'prix' : sortField === 'expiry_date' ? 'expiration' : 'catégorie'}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Chargement de l'inventaire...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Pill className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun médicament trouvé</p>
            <p className="text-sm text-gray-400 mt-1">Modifiez vos filtres ou ajoutez un nouveau médicament</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left px-4 py-3">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                      Médicament
                      {sortField === 'name' && <ChevronDown className={`w-3 h-3 transition-transform ${!sortAsc ? 'rotate-180' : ''}`} />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">
                    <button onClick={() => handleSort('category')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                      Catégorie
                      {sortField === 'category' && <ChevronDown className={`w-3 h-3 transition-transform ${!sortAsc ? 'rotate-180' : ''}`} />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden md:table-cell font-medium text-gray-600">Forme</th>
                  <th className="text-center px-4 py-3">
                    <button onClick={() => handleSort('current_stock')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 mx-auto">
                      Stock
                      {sortField === 'current_stock' && <ChevronDown className={`w-3 h-3 transition-transform ${!sortAsc ? 'rotate-180' : ''}`} />}
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 hidden sm:table-cell">
                    <button onClick={() => handleSort('unit_price')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 mx-auto">
                      Prix
                      {sortField === 'unit_price' && <ChevronDown className={`w-3 h-3 transition-transform ${!sortAsc ? 'rotate-180' : ''}`} />}
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 hidden xl:table-cell">
                    <button onClick={() => handleSort('expiry_date')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 mx-auto">
                      Expiration
                      {sortField === 'expiry_date' && <ChevronDown className={`w-3 h-3 transition-transform ${!sortAsc ? 'rotate-180' : ''}`} />}
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((med, idx) => {
                  const status = getStockStatus(med);
                  const stockPercent = Math.min(100, (med.current_stock / med.maximum_stock) * 100);
                  const isExpiringSoon = med.expiry_date && new Date(med.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                  return (
                    <motion.tr
                      key={med.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            status === 'rupture' ? 'bg-red-100' :
                            status === 'low' ? 'bg-amber-100' :
                            'bg-teal-50'
                          }`}>
                            <Pill className={`w-4 h-4 ${
                              status === 'rupture' ? 'text-red-500' :
                              status === 'low' ? 'text-amber-500' :
                              'text-teal-500'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-teal-700 transition-colors">{med.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span>{med.code}</span>
                              {med.generic_name && <span>- {med.generic_name}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${categoryColors[med.category] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {med.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
                        {med.form} - {med.dosage}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-semibold ${
                            status === 'rupture' ? 'text-red-600' :
                            status === 'low' ? 'text-amber-600' :
                            'text-gray-900'
                          }`}>
                            {med.current_stock}
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                status === 'rupture' ? 'bg-red-400' :
                                status === 'low' ? 'bg-amber-400' :
                                'bg-teal-400'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 hidden sm:table-cell">
                        ${med.unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center hidden xl:table-cell">
                        {med.expiry_date ? (
                          <span className={`text-xs ${isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                            {new Date(med.expiry_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {status === 'ok' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> OK
                          </span>
                        )}
                        {status === 'low' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Bas
                          </span>
                        )}
                        {status === 'rupture' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> Rupture
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddMedicationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
