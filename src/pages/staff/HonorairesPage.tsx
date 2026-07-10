import { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  Search,
  Filter,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HonoraireRow {
  id: string;
  date_prestation: string;
  medecin_id: string;
  medecin_nom: string;
  facture_id: string | null;
  invoice_number: string | null;
  libelle_acte: string | null;
  montant_acte: number;
  mode_remuneration: string;
  pourcentage: number | null;
  montant_forfait: number | null;
  montant_du: number;
  statut_paiement: string;
  reference_etat: string | null;
}

interface MedecinGroup {
  medecin_id: string;
  medecin_nom: string;
  reference_etat: string | null;
  statut: string;
  total_du: number;
  actes: HonoraireRow[];
}

export default function HonorairesPage() {
  const [rows, setRows] = useState<HonoraireRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMedecin, setFilterMedecin] = useState('all');
  const [filterStatut, setFilterStatut] = useState<'all' | 'non_paye' | 'paye'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [medecins, setMedecins] = useState<Array<{ id: string; nom_complet: string }>>([]);

  const fetchMedecins = useCallback(async () => {
    const { data } = await supabase
      .from('medecins_prestataires')
      .select('id, nom_complet')
      .eq('actif', true)
      .order('nom_complet');
    if (data) setMedecins(data);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('honoraires_medecins')
        .select('*, medecins_prestataires(nom_complet), invoices(invoice_number)')
        .order('created_at', { ascending: false });

      if (filterDate) {
        query = query.eq('date_prestation', filterDate);
      }
      if (filterMedecin !== 'all') {
        query = query.eq('medecin_id', filterMedecin);
      }
      if (filterStatut !== 'all') {
        query = query.eq('statut_paiement', filterStatut);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRows(
        (data || []).map((r: Record<string, unknown>) => {
          const med = r.medecins_prestataires as { nom_complet: string } | null;
          const inv = r.invoices as { invoice_number: string } | null;
          return {
            id: r.id as string,
            date_prestation: r.date_prestation as string,
            medecin_id: r.medecin_id as string,
            medecin_nom: med?.nom_complet || 'Medecin inconnu',
            facture_id: r.facture_id as string | null,
            invoice_number: inv?.invoice_number || null,
            libelle_acte: r.libelle_acte as string | null,
            montant_acte: Number(r.montant_acte || 0),
            mode_remuneration: r.mode_remuneration as string,
            pourcentage: r.pourcentage != null ? Number(r.pourcentage) : null,
            montant_forfait: r.montant_forfait != null ? Number(r.montant_forfait) : null,
            montant_du: Number(r.montant_du || 0),
            statut_paiement: r.statut_paiement as string,
            reference_etat: r.reference_etat as string | null,
          };
        })
      );
    } catch (err) {
      console.error('Error fetching honoraires:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterMedecin, filterStatut]);

  useEffect(() => { fetchMedecins(); }, [fetchMedecins]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(
    (r) =>
      r.medecin_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reference_etat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.libelle_acte || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groups: MedecinGroup[] = [];
  const groupMap = new Map<string, MedecinGroup>();
  for (const r of filtered) {
    const key = `${r.medecin_id}__${r.reference_etat || 'sans-ref'}`;
    let g = groupMap.get(key);
    if (!g) {
      g = {
        medecin_id: r.medecin_id,
        medecin_nom: r.medecin_nom,
        reference_etat: r.reference_etat,
        statut: r.statut_paiement,
        total_du: 0,
        actes: [],
      };
      groupMap.set(key, g);
      groups.push(g);
    }
    g.actes.push(r);
    g.total_du += r.montant_du;
    if (r.statut_paiement === 'non_paye') g.statut = 'non_paye';
  }

  const totalGlobal = filtered.reduce((s, r) => s + r.montant_du, 0);
  const totalPaye = filtered.filter((r) => r.statut_paiement === 'paye').reduce((s, r) => s + r.montant_du, 0);
  const totalAPayer = filtered.filter((r) => r.statut_paiement !== 'paye').reduce((s, r) => s + r.montant_du, 0);

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            Honoraires Medecins
          </h1>
          <p className="text-gray-500 mt-1">
            Suivi des honoraires dus aux medecins prestataires
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total honoraires</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {totalGlobal.toLocaleString('fr-FR')} <span className="text-base font-medium text-gray-500">USD</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">A payer</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {totalAPayer.toLocaleString('fr-FR')} <span className="text-base font-medium text-gray-500">USD</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payes</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {totalPaye.toLocaleString('fr-FR')} <span className="text-base font-medium text-gray-500">USD</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par medecin, reference ou acte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <select
                value={filterMedecin}
                onChange={(e) => setFilterMedecin(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white"
              >
                <option value="all">Tous les medecins</option>
                {medecins.map((m) => (
                  <option key={m.id} value={m.id}>{m.nom_complet}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1.5">
              {(['all', 'non_paye', 'paye'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatut(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    filterStatut === s
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    {s === 'all' ? 'Tous' : s === 'non_paye' ? 'A payer' : 'Payes'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grouped list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">
            <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucun honoraire pour cette periode</p>
            <p className="text-sm mt-1">Les honoraires apparaitront ici apres le paiement de factures</p>
          </div>
        ) : (
          groups.map((g) => {
            const key = `${g.medecin_id}__${g.reference_etat || 'sans-ref'}`;
            const isExpanded = expandedGroups.has(key);
            const isPaid = g.statut === 'paye';

            return (
              <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPaid ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <User className={`w-6 h-6 ${isPaid ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{g.medecin_nom}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {g.reference_etat && (
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {g.reference_etat}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{g.actes.length} acte{g.actes.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {isPaid ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {isPaid ? 'Paye' : 'A payer'}
                    </span>
                    <span className="font-bold text-lg text-gray-900">
                      {g.total_du.toLocaleString('fr-FR')} USD
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Acte</th>
                          <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Prix acte</th>
                          <th className="text-center px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Mode</th>
                          <th className="text-center px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">%/Forfait</th>
                          <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Honoraire</th>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Facture</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {g.actes.map((a) => (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="px-5 py-2.5 text-sm text-gray-900">{a.libelle_acte || '-'}</td>
                            <td className="px-5 py-2.5 text-sm text-right text-gray-700">{a.montant_acte.toLocaleString('fr-FR')} USD</td>
                            <td className="px-5 py-2.5 text-sm text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                a.mode_remuneration === 'pourcentage' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                                {a.mode_remuneration === 'pourcentage' ? 'Pourcentage' : 'Forfait'}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-sm text-center text-gray-700">
                              {a.mode_remuneration === 'pourcentage'
                                ? `${a.pourcentage || 0}%`
                                : `${(a.montant_forfait || 0).toLocaleString('fr-FR')} USD`}
                            </td>
                            <td className="px-5 py-2.5 text-sm text-right font-semibold text-gray-900">
                              {a.montant_du.toLocaleString('fr-FR')} USD
                            </td>
                            <td className="px-5 py-2.5 text-xs font-mono text-gray-500">
                              {a.invoice_number || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t border-gray-200">
                          <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-gray-700 text-right">
                            TOTAL A PAYER
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-lg text-gray-900">
                            {g.total_du.toLocaleString('fr-FR')} USD
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
