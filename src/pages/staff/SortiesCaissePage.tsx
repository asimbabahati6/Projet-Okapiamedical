import { useState, useEffect, useRef } from 'react';
import { Banknote, Calendar, Filter, Printer, RefreshCw, FileText, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BonSortie {
  id: string;
  numero_bon_sortie: string;
  expense_date: string;
  amount: number;
  category: string;
  description: string;
  payment_method: string;
  beneficiaire_type?: string;
  beneficiaire_nom?: string;
  piece_justificative_ref?: string;
  service_destinataire_id?: string;
  created_at: string;
  department?: { name: string };
  beneficiaire_user?: { full_name: string };
  created_by_user?: { full_name: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  logiciel: 'Logiciel',
  frais_generaux: 'Frais generaux',
  salaires_charges: 'Salaires et charges sociales',
  avance_salaire: 'Avance sur salaire',
  soins_medicaux: 'Soins medicaux',
  autres_charges_personnel: 'Autres charges du Personnel',
  frais_mission: 'Frais de mission',
  primes: 'Primes',
  frais_transport: 'Frais de transport',
  achat_marchandises: 'Achat de Marchandises',
  import_taxes: 'Import et Taxes',
  materiels_bureau: 'Materiels de Bureau',
  assurances: 'Assurances',
  depenses_informatiques: 'Depenses informatiques',
  frais_juridiques: 'Frais juridiques et Administratifs',
  dons_rse: 'Dons et RSE',
  marchandises: 'Marchandises',
  materiels_fournitures: 'Materiels et fournitures',
  energie_courant_carburant: 'Energie / Courant / Carburant',
  loyer: 'Loyer',
  autres_services: 'Autres services',
  communication: 'Communication',
  autres_depenses: 'Autres Depenses',
  utilities: 'Services Publics',
  maintenance: 'Maintenance',
  supplies: 'Fournitures',
  equipment: 'Equipement',
  marketing: 'Marketing',
};

function numberToWordsFR(n: number): string {
  if (n === 0) return 'zero';
  const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  function convert(num: number): string {
    if (num < 20) return ones[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7 || t === 9) return tens[t] + '-' + ones[10 + u];
      if (u === 0) return tens[t] + (t === 8 ? 's' : '');
      if (u === 1 && t !== 8) return tens[t] + ' et un';
      return tens[t] + '-' + ones[u];
    }
    if (num < 1000) {
      const h = Math.floor(num / 100);
      const rest = num % 100;
      const prefix = h === 1 ? 'cent' : ones[h] + ' cent';
      if (rest === 0) return h > 1 ? prefix + 's' : prefix;
      return prefix + ' ' + convert(rest);
    }
    if (num < 1000000) {
      const th = Math.floor(num / 1000);
      const rest = num % 1000;
      const prefix = th === 1 ? 'mille' : convert(th) + ' mille';
      if (rest === 0) return prefix;
      return prefix + ' ' + convert(rest);
    }
    return String(num);
  }

  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  let result = convert(intPart) + ' dollar' + (intPart > 1 ? 's' : '');
  if (decPart > 0) {
    result += ' et ' + convert(decPart) + ' cent' + (decPart > 1 ? 's' : '');
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export default function SortiesCaissePage() {
  const [bons, setBons] = useState<BonSortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [printingBon, setPrintingBon] = useState<BonSortie | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDepts() {
      const { data } = await supabase.from('departments').select('id, name').eq('is_active', true).order('name');
      setDepartments(data || []);
    }
    loadDepts();
  }, []);

  useEffect(() => {
    fetchBons();
  }, [dateFilter]);

  async function fetchBons() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id, numero_bon_sortie, expense_date, amount, category, description, payment_method,
          beneficiaire_type, beneficiaire_nom, piece_justificative_ref, service_destinataire_id, created_at,
          department:departments!expenses_service_destinataire_id_fkey(name),
          beneficiaire_user:user_profiles!expenses_beneficiaire_id_fkey(full_name),
          created_by_user:user_profiles!expenses_created_by_fkey(full_name)
        `)
        .eq('expense_date', dateFilter)
        .eq('approval_status', 'approved')
        .not('numero_bon_sortie', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBons(data || []);
    } catch (err) {
      console.error('Error fetching bons:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = serviceFilter === 'all'
    ? bons
    : bons.filter(b => b.service_destinataire_id === serviceFilter);

  const totalDay = filtered.reduce((s, b) => s + b.amount, 0);

  function handlePrint(bon: BonSortie) {
    setPrintingBon(bon);
    setTimeout(() => {
      const printContent = printRef.current;
      if (!printContent) return;
      const w = window.open('', '_blank', 'width=800,height=600');
      if (!w) return;
      w.document.write(`
        <html><head><title>Bon de Sortie - ${bon.numero_bon_sortie}</title>
        <style>
          @page { size: A5 landscape; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; font-size: 13px; }
          .header { text-align: center; border-bottom: 2px solid #1a5276; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { margin: 0; font-size: 20px; color: #1a5276; letter-spacing: 1px; }
          .header p { margin: 2px 0; font-size: 11px; color: #555; }
          .bon-title { text-align: center; font-size: 16px; font-weight: bold; margin: 16px 0 12px; text-transform: uppercase; letter-spacing: 2px; color: #1a5276; border: 1px solid #1a5276; display: inline-block; padding: 6px 24px; margin-left: auto; margin-right: auto; }
          .bon-title-wrap { text-align: center; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 16px 0; }
          .info-row { display: flex; gap: 8px; }
          .info-label { font-weight: 600; color: #555; min-width: 140px; }
          .info-value { color: #1a1a1a; }
          .amount-box { background: #f0f4f8; border: 1px solid #1a5276; border-radius: 6px; padding: 12px; margin: 16px 0; text-align: center; }
          .amount-box .number { font-size: 22px; font-weight: bold; color: #1a5276; }
          .amount-box .words { font-size: 11px; color: #555; font-style: italic; margin-top: 4px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 12px; }
          .sig-block { text-align: center; width: 200px; }
          .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 6px; font-size: 12px; font-weight: 600; }
          @media print { body { padding: 0; } }
        </style></head><body>
        ${printContent.innerHTML}
        <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
        </body></html>
      `);
      w.document.close();
      setPrintingBon(null);
    }, 100);
  }

  function getBenefName(bon: BonSortie): string {
    if (bon.beneficiaire_type === 'interne') return bon.beneficiaire_user?.full_name || '-';
    return bon.beneficiaire_nom || '-';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <Banknote className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sorties Caisse</h1>
              <p className="text-gray-500 text-sm mt-0.5">Bons de sortie journaliers</p>
            </div>
          </div>
          <button
            onClick={fetchBons}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filters + Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-500" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Tous les services</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total du jour</p>
              <p className="text-2xl font-bold text-emerald-700">
                {totalDay.toLocaleString('fr-FR')} <span className="text-sm font-medium text-gray-400">USD</span>
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-emerald-600 font-semibold">{filtered.length}</p>
              <p className="text-xs text-emerald-500">bons</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bons Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N Bon</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif / Categorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiaire</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref. Piece</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Imprimer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Aucun bon de sortie</p>
                    <p className="text-sm">pour la date selectionnee</p>
                  </td>
                </tr>
              ) : (
                filtered.map((bon) => (
                  <tr key={bon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-800">
                      {bon.numero_bon_sortie}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(bon.expense_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                      {bon.amount.toLocaleString('fr-FR')} USD
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {bon.department?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px]">
                      <p className="truncate">{bon.description}</p>
                      <p className="text-xs text-gray-400">{CATEGORY_LABELS[bon.category] || bon.category}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getBenefName(bon)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 max-w-[120px] truncate">
                      {bon.piece_justificative_ref || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handlePrint(bon)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm font-medium"
                        title="Imprimer ce bon"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Bon
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden print template */}
      {printingBon && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={printRef}>
            <div className="header">
              <h1>OKAPIA MEDICAL</h1>
              <p>Centre Medical Multidisciplinaire</p>
              <p>Kinshasa, Republique Democratique du Congo</p>
            </div>
            <div className="bon-title-wrap">
              <div className="bon-title">Bon de Sortie de Caisse</div>
            </div>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">N du Bon :</span>
                <span className="info-value" style={{ fontWeight: 'bold' }}>{printingBon.numero_bon_sortie}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date :</span>
                <span className="info-value">{new Date(printingBon.expense_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Service :</span>
                <span className="info-value">{printingBon.department?.name || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Beneficiaire :</span>
                <span className="info-value">{getBenefName(printingBon)}</span>
              </div>
              <div className="info-row" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Motif :</span>
                <span className="info-value">{printingBon.description}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Categorie :</span>
                <span className="info-value">{CATEGORY_LABELS[printingBon.category] || printingBon.category}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ref. Piece justif. :</span>
                <span className="info-value">{printingBon.piece_justificative_ref || '-'}</span>
              </div>
            </div>
            <div className="amount-box">
              <div className="number">{printingBon.amount.toLocaleString('fr-FR')} USD</div>
              <div className="words">{numberToWordsFR(printingBon.amount)}</div>
            </div>
            <div className="signatures">
              <div className="sig-block">
                <div className="sig-line">La Caissiere</div>
              </div>
              <div className="sig-block">
                <div className="sig-line">Autorise par</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
