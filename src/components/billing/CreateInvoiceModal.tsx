import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Trash2, Calculator, Receipt, Search, Loader2, Percent, Tag, Users, Stethoscope, UserPlus, ChevronDown, CheckCircle, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
  phone: string;
}

interface MedicalActSuggestion {
  id: string;
  act_name: string;
  category: string;
  price_usd: number;
  price_cdf: number;
}

interface Convention {
  id: string;
  nom: string;
  code: string;
  taux_prise_en_charge: number | null;
}

interface MedecinPrestataire {
  id: string;
  nom_complet: string;
  specialite: string | null;
  type: string;
  source: string;
  taux_commission_defaut: number | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  medecin_prestataire_id: string | null;
  mode_remuneration: string | null;
  valeur_remuneration: number | null;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  forfait_usd: number;
}

interface ItemErrors {
  description?: string;
  unit_price?: string;
  quantity?: string;
}

interface FieldErrors {
  patient?: string;
  items?: Record<string, ItemErrors>;
  general?: string;
  convention?: string;
}

type ClientType = 'ordinaire' | 'prive' | 'conventionne';

const ITEM_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'laboratory', label: 'Analyse de laboratoire' },
  { value: 'radiology', label: 'Radiologie' },
  { value: 'pharmacy', label: 'Pharmacie' },
  { value: 'hospitalization', label: 'Hospitalisation' },
  { value: 'surgery', label: 'Chirurgie' },
  { value: 'other', label: 'Autre' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Especes' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'card', label: 'Carte de credit' },
  { value: 'insurance', label: 'Assurance' },
];

const TVA_RATE = 16;
const COMMISSION_QUICK = [5, 10, 15, 20];
const HONORAIRE_QUICK = [5, 10, 15, 20, 25, 30, 40, 50];
const FORFAIT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const ENDOSCOPY_KEYWORDS = [
  'endoscopie', 'bronchoscopie', 'gastrocopie', 'gastroscopie',
  'restrocopie', 'rectoscopie', 'colonoscopie', 'anapath', 'anesthesie',
];

function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isEndoscopyAct(description: string): boolean {
  const normalized = normalizeForSearch(description);
  return ENDOSCOPY_KEYWORDS.some(kw => normalized.includes(kw));
}

function makeItem(): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    item_type: 'consultation',
    quantity: 1,
    unit_price: 0,
    medecin_prestataire_id: null,
    mode_remuneration: null,
    valeur_remuneration: null,
    discount_type: 'fixed',
    discount_value: 0,
    forfait_usd: 0,
  };
}

function SearchableSelect({
  value,
  onChange,
  placeholder,
  groups,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  groups: { label: string; options: { id: string; display: string; sub?: string }[] }[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allOptions = groups.flatMap(g => g.options);
  const selected = allOptions.find(o => o.id === value);
  const term = search.toLowerCase();

  const filteredGroups = groups
    .map(g => ({
      ...g,
      options: g.options.filter(
        o => o.display.toLowerCase().includes(term) || (o.sub && o.sub.toLowerCase().includes(term))
      ),
    }))
    .filter(g => g.options.length > 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm text-left hover:border-gray-400 transition-colors bg-white"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.display : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50"
            >
              -- Aucun --
            </button>
            {filteredGroups.map(g => (
              <div key={g.label}>
                <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase bg-gray-50 sticky top-0">
                  {g.label}
                </div>
                {g.options.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { onChange(o.id); setOpen(false); setSearch(''); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                      o.id === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {o.display}
                    {o.sub && <span className="text-xs text-gray-400 ml-2">({o.sub})</span>}
                  </button>
                ))}
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Aucun resultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function computeLineTotal(item: InvoiceItem): { gross: number; discountAmount: number; net: number } {
  const gross = item.quantity * item.unit_price;
  let discountAmount = 0;
  if (item.discount_value > 0) {
    if (item.discount_type === 'percentage') {
      discountAmount = parseFloat((gross * Math.min(item.discount_value, 100) / 100).toFixed(2));
    } else {
      discountAmount = parseFloat(Math.min(item.discount_value, gross).toFixed(2));
    }
  }
  const afterDiscount = gross - discountAmount;
  const forfait = item.forfait_usd || 0;
  return { gross, discountAmount, net: parseFloat((afterDiscount + forfait).toFixed(2)) };
}

export function CreateInvoiceModal({ onClose, onSuccess }: CreateInvoiceModalProps) {
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([makeItem()]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [applyTva, setApplyTva] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [sentToCaisse, setSentToCaisse] = useState(false);

  const [clientType, setClientType] = useState<ClientType>('ordinaire');
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [selectedConventionId, setSelectedConventionId] = useState<string>('');

  const [allMedecins, setAllMedecins] = useState<MedecinPrestataire[]>([]);
  // Apporteur: free-text with autocomplete
  const [apporteurSearchText, setApporteurSearchText] = useState('');
  const [medecinApporteurId, setMedecinApporteurId] = useState<string>('');
  const [pourcentageCommission, setPourcentageCommission] = useState<number>(0);
  const [showApporteurDropdown, setShowApporteurDropdown] = useState(false);
  const [tauxCommissionDefaut, setTauxCommissionDefaut] = useState<number>(10);
  const apporteurRef = useRef<HTMLDivElement>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [actSuggestions, setActSuggestions] = useState<Record<string, MedicalActSuggestion[]>>({});
  const [activeActDropdown, setActiveActDropdown] = useState<string | null>(null);
  const [actSearchLoading, setActSearchLoading] = useState<string | null>(null);
  const actDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function load() {
      const [convRes, medRes, settingsRes] = await Promise.all([
        supabase
          .from('conventions')
          .select('id, nom, code, taux_prise_en_charge')
          .eq('actif', true)
          .order('nom'),
        supabase
          .from('medecins_prestataires')
          .select('id, nom_complet, specialite, type, source, taux_commission_defaut')
          .eq('actif', true)
          .order('nom_complet'),
        supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'taux_commission_apporteur_defaut')
          .maybeSingle(),
      ]);
      setConventions(convRes.data || []);
      setAllMedecins(medRes.data || []);
      if (settingsRes.data?.setting_value) {
        setTauxCommissionDefaut(parseFloat(settingsRes.data.setting_value) || 10);
      }
    }
    load();
  }, []);

  const prestataireGroups = (() => {
    const eligible = allMedecins.filter(m => m.type === 'prestataire' || m.type === 'les_deux');
    const internes = eligible.filter(m => m.source === 'interne');
    const externes = eligible.filter(m => m.source === 'externe');
    const groups: { label: string; options: { id: string; display: string; sub?: string }[] }[] = [];
    if (internes.length > 0) {
      groups.push({
        label: 'Medecins Okapia',
        options: internes.map(m => ({ id: m.id, display: m.nom_complet, sub: m.specialite || undefined })),
      });
    }
    if (externes.length > 0) {
      groups.push({
        label: 'Medecins externes',
        options: externes.map(m => ({ id: m.id, display: m.nom_complet, sub: m.specialite || undefined })),
      });
    }
    return groups;
  })();

  // Apporteur autocomplete: filter medecins by search text
  const apporteurSuggestions = (() => {
    if (apporteurSearchText.length < 1) return [];
    const term = normalizeForSearch(apporteurSearchText);
    const eligible = allMedecins.filter(m => m.type === 'apporteur' || m.type === 'les_deux');
    return eligible.filter(m => normalizeForSearch(m.nom_complet).includes(term)).slice(0, 15);
  })();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (apporteurRef.current && !apporteurRef.current.contains(e.target as Node))
        setShowApporteurDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleActClickOutside(e: MouseEvent) {
      if (activeActDropdown) {
        const ref = actDropdownRefs.current[activeActDropdown];
        if (ref && !ref.contains(e.target as Node)) {
          setActiveActDropdown(null);
        }
      }
    }
    document.addEventListener('mousedown', handleActClickOutside);
    return () => document.removeEventListener('mousedown', handleActClickOutside);
  }, [activeActDropdown]);

  useEffect(() => {
    return () => {
      if (actSearchTimerRef.current) clearTimeout(actSearchTimerRef.current);
    };
  }, []);

  const searchMedicalActs = useCallback(async (term: string, itemId: string) => {
    if (term.length < 2) {
      setActSuggestions(prev => ({ ...prev, [itemId]: [] }));
      setActiveActDropdown(null);
      return;
    }
    setActSearchLoading(itemId);
    try {
      const pattern = `%${term}%`;
      const { data } = await supabase
        .from('medical_acts_pricing')
        .select('id, act_name, category, price_usd, price_cdf')
        .eq('is_active', true)
        .or(`act_name.ilike.${pattern},category.ilike.${pattern}`)
        .order('category')
        .order('act_name')
        .limit(50);
      setActSuggestions(prev => ({ ...prev, [itemId]: data || [] }));
      setActiveActDropdown(itemId);
    } catch {
      setActSuggestions(prev => ({ ...prev, [itemId]: [] }));
    } finally {
      setActSearchLoading(null);
    }
  }, []);

  function handleActDescriptionChange(itemId: string, value: string) {
    updateItem(itemId, 'description', value);
    if (actSearchTimerRef.current) clearTimeout(actSearchTimerRef.current);
    if (value.length < 2) {
      setActSuggestions(prev => ({ ...prev, [itemId]: [] }));
      setActiveActDropdown(null);
      return;
    }
    actSearchTimerRef.current = setTimeout(() => {
      searchMedicalActs(value, itemId);
    }, 300);
  }

  function selectMedicalAct(itemId: string, act: MedicalActSuggestion) {
    const isForfaitAct = isEndoscopyAct(act.act_name);
    setItems(prev => prev.map(i =>
      i.id === itemId
        ? { ...i, description: act.act_name, unit_price: act.price_usd, forfait_usd: isForfaitAct ? i.forfait_usd : 0 }
        : i
    ));
    setActiveActDropdown(null);
    setActSuggestions(prev => ({ ...prev, [itemId]: [] }));
    setFieldErrors(prev => {
      if (!prev.items?.[itemId]) return prev;
      const itemErrs = { ...prev.items[itemId] };
      delete itemErrs.description;
      delete itemErrs.unit_price;
      const nextItems = { ...prev.items, [itemId]: itemErrs };
      if (!Object.keys(itemErrs).length) delete nextItems[itemId];
      return { ...prev, items: Object.keys(nextItems).length ? nextItems : undefined };
    });
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setShowPatientDropdown(false);
      return;
    }
    setSearchLoading(true);
    try {
      const pattern = `%${term}%`;
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, patient_number, phone')
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},patient_number.ilike.${pattern},phone.ilike.${pattern}`)
        .order('last_name')
        .limit(20);
      setSearchResults(data || []);
      setShowPatientDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function handlePatientSearchChange(value: string) {
    setPatientSearch(value);
    setFieldErrors(prev => ({ ...prev, patient: undefined }));
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.length < 2) {
      setSearchResults([]);
      setShowPatientDropdown(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      searchPatients(value);
    }, 300);
  }

  function selectPatient(p: Patient) {
    setSelectedPatient(p);
    setShowPatientDropdown(false);
    setPatientSearch('');
    setFieldErrors(prev => ({ ...prev, patient: undefined }));
  }

  function clearPatient() {
    setSelectedPatient(null);
    setPatientSearch('');
    setSearchResults([]);
  }

  function addItem() {
    setItems(prev => [...prev, makeItem()]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
    setFieldErrors(prev => {
      if (!prev.items) return prev;
      const next = { ...prev.items };
      delete next[id];
      return { ...prev, items: Object.keys(next).length ? next : undefined };
    });
  }

  function updateItem(id: string, field: keyof InvoiceItem, value: string | number | null) {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      if (field === 'description' && typeof value === 'string' && !isEndoscopyAct(value)) {
        updated.forfait_usd = 0;
      }
      return updated;
    }));
    setFieldErrors(prev => {
      if (!prev.items?.[id]) return prev;
      const itemErrs = { ...prev.items[id] };
      if (field === 'description') delete itemErrs.description;
      if (field === 'unit_price') delete itemErrs.unit_price;
      if (field === 'quantity') delete itemErrs.quantity;
      const nextItems = { ...prev.items, [id]: itemErrs };
      if (!Object.keys(itemErrs).length) delete nextItems[id];
      return { ...prev, items: Object.keys(nextItems).length ? nextItems : undefined };
    });
  }

  function updateItemPrestataire(id: string, medecinId: string) {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (!medecinId) {
        return { ...i, medecin_prestataire_id: null, mode_remuneration: null, valeur_remuneration: null };
      }
      return { ...i, medecin_prestataire_id: medecinId, mode_remuneration: i.mode_remuneration || 'pourcentage', valeur_remuneration: i.valeur_remuneration ?? 0 };
    }));
  }

  // Apporteur: select from autocomplete
  function selectApporteur(m: MedecinPrestataire) {
    setMedecinApporteurId(m.id);
    setApporteurSearchText(m.nom_complet);
    setShowApporteurDropdown(false);
    const commRate = m.taux_commission_defaut ?? tauxCommissionDefaut;
    setPourcentageCommission(commRate);
  }

  function clearApporteur() {
    setMedecinApporteurId('');
    setApporteurSearchText('');
    setPourcentageCommission(0);
  }

  function handleApporteurTextChange(value: string) {
    setApporteurSearchText(value);
    setMedecinApporteurId('');
    if (value.length >= 1) {
      setShowApporteurDropdown(true);
    } else {
      setShowApporteurDropdown(false);
      setPourcentageCommission(0);
    }
    if (value.length >= 2 && !medecinApporteurId) {
      setPourcentageCommission(tauxCommissionDefaut);
    }
  }

  const subtotal = items.reduce((sum, i) => sum + computeLineTotal(i).net, 0);
  const validItemCount = items.filter(i => i.description.trim() && i.unit_price > 0).length;
  const tvaAmount = applyTva ? parseFloat((subtotal * TVA_RATE / 100).toFixed(2)) : 0;
  const netToPay = parseFloat((subtotal + tvaAmount).toFixed(2));

  const hasApporteur = medecinApporteurId || apporteurSearchText.trim().length >= 2;

  function computeHonoraire(item: InvoiceItem): number {
    if (!item.medecin_prestataire_id || !item.valeur_remuneration) return 0;
    const lineTotal = item.quantity * item.unit_price;
    if (item.mode_remuneration === 'pourcentage') {
      return parseFloat((lineTotal * item.valeur_remuneration / 100).toFixed(2));
    }
    return item.valeur_remuneration;
  }

  const totalHonoraires = items.reduce((sum, i) => sum + computeHonoraire(i), 0);
  const totalCommission = hasApporteur && pourcentageCommission > 0
    ? parseFloat((subtotal * pourcentageCommission / 100).toFixed(2))
    : 0;

  function validate(): boolean {
    const errors: FieldErrors = {};
    let valid = true;

    if (!selectedPatient) {
      errors.patient = 'Veuillez selectionner un patient.';
      valid = false;
    }

    if (clientType === 'conventionne' && !selectedConventionId) {
      errors.convention = 'Veuillez selectionner une convention.';
      valid = false;
    }

    const itemErrors: Record<string, ItemErrors> = {};
    let hasValidItem = false;

    for (const item of items) {
      const ie: ItemErrors = {};
      if (!item.description.trim()) {
        ie.description = 'La description est requise.';
        valid = false;
      }
      if (item.quantity < 1) {
        ie.quantity = 'Minimum 1.';
        valid = false;
      }
      if (item.unit_price <= 0) {
        ie.unit_price = 'Le prix doit etre superieur a 0.';
        valid = false;
      }
      if (Object.keys(ie).length) {
        itemErrors[item.id] = ie;
      } else {
        hasValidItem = true;
      }
    }

    if (!hasValidItem && !Object.keys(itemErrors).length) {
      errors.general = 'Ajoutez au moins un article valide.';
      valid = false;
    }

    if (Object.keys(itemErrors).length) {
      errors.items = itemErrors;
    }

    setFieldErrors(errors);
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setFieldErrors({});

    try {
      const validItems = items.filter(i => i.description.trim() && i.unit_price > 0 && i.quantity >= 1);
      const typeFacture = clientType === 'conventionne' ? 'conventionne' : 'cash';

      const isApporteurLibre = !medecinApporteurId && apporteurSearchText.trim().length >= 2;
      const apporteurNomLibre = isApporteurLibre ? apporteurSearchText.trim() : null;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          patient_id: selectedPatient!.id,
          total_amount: subtotal,
          paid_amount: 0,
          balance: netToPay,
          status: 'pending',
          payment_method: paymentMethod,
          notes: notes || null,
          tva_rate: applyTva ? TVA_RATE : 0,
          tva_amount: tvaAmount,
          net_to_pay: netToPay,
          discount_value: 0,
          discount_type: 'fixed',
          type_facture: typeFacture,
          convention_id: clientType === 'conventionne' ? selectedConventionId : null,
          medecin_apporteur_id: medecinApporteurId || null,
          medecin_apporteur_nom_libre: apporteurNomLibre,
          pourcentage_commission: hasApporteur ? (pourcentageCommission || null) : null,
          taux_commission_defaut_applique: isApporteurLibre ? tauxCommissionDefaut : null,
        })
        .select('id')
        .single();

      if (invoiceError) throw invoiceError;

      const itemRows = validItems.map(item => {
        const { discountAmount, net } = computeLineTotal(item);
        return {
          invoice_id: invoice.id,
          description: item.description.trim(),
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: net,
          medecin_prestataire_id: item.medecin_prestataire_id || null,
          mode_remuneration: item.medecin_prestataire_id ? (item.mode_remuneration || null) : null,
          valeur_remuneration: item.medecin_prestataire_id ? (item.valeur_remuneration || null) : null,
          discount_type: item.discount_value > 0 ? item.discount_type : null,
          discount_value: item.discount_value || 0,
          discount_amount: discountAmount,
          forfait_usd: item.forfait_usd || 0,
        };
      });

      const { error: itemsError } = await supabase.from('invoice_items').insert(itemRows);
      if (itemsError) throw itemsError;

      if (typeFacture === 'cash') {
        setSentToCaisse(true);
        setTimeout(() => { setSentToCaisse(false); onSuccess(); }, 2500);
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Erreur inconnue';
      setFieldErrors({ general: `Echec de la creation: ${message}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Nouvelle Facture</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentToCaisse && (
          <div className="absolute inset-0 bg-white/95 z-10 flex items-center justify-center rounded-2xl">
            <div className="text-center animate-in fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">Facture envoyee a la caisse</p>
              <p className="text-sm text-gray-500 mt-1">La caissiere en est notifiee en temps reel.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {fieldErrors.general && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {fieldErrors.general}
                </div>
              )}

              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Patient *</label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedPatient.last_name} {selectedPatient.first_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedPatient.patient_number} {selectedPatient.phone ? `- ${selectedPatient.phone}` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={clearPatient} className="text-gray-400 hover:text-red-500 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un patient par nom, numero ou telephone..."
                      value={patientSearch}
                      onChange={(e) => handlePatientSearchChange(e.target.value)}
                      onFocus={() => { if (searchResults.length > 0) setShowPatientDropdown(true); }}
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        fieldErrors.patient ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                      }`}
                    />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {showPatientDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.length === 0 ? (
                          <div className="p-3 text-sm text-gray-400 text-center">
                            {searchLoading ? 'Recherche...' : 'Aucun patient trouve'}
                          </div>
                        ) : (
                          searchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectPatient(p)}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <span className="font-medium text-gray-900">{p.last_name} {p.first_name}</span>
                              <span className="text-xs text-gray-400 ml-2">{p.patient_number}</span>
                              {p.phone && <span className="text-xs text-gray-400 ml-2">{p.phone}</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {fieldErrors.patient && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.patient}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Type de Client */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Type de client</h3>
                </div>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {([
                    { value: 'ordinaire', label: 'Ordinaire' },
                    { value: 'prive', label: 'Prive' },
                    { value: 'conventionne', label: 'Conventionne' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setClientType(opt.value);
                        if (opt.value !== 'conventionne') setSelectedConventionId('');
                        setFieldErrors(prev => ({ ...prev, convention: undefined }));
                      }}
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                        clientType === opt.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {clientType === 'conventionne' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Convention *</label>
                    <select
                      value={selectedConventionId}
                      onChange={(e) => {
                        setSelectedConventionId(e.target.value);
                        setFieldErrors(prev => ({ ...prev, convention: undefined }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        fieldErrors.convention ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Selectionner une convention --</option>
                      {conventions.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nom} ({c.code}){c.taux_prise_en_charge ? ` - ${c.taux_prise_en_charge}%` : ''}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.convention && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.convention}</p>
                    )}
                    {conventions.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">Aucune convention active trouvee.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Articles *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un article
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const ie = fieldErrors.items?.[item.id];
                    const { gross, discountAmount, net } = computeLineTotal(item);
                    const honAmount = computeHonoraire(item);
                    const showForfait = isEndoscopyAct(item.description);

                    return (
                      <div key={item.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400 uppercase">Article {idx + 1}</span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2 relative" ref={el => { actDropdownRefs.current[item.id] = el; }}>
                            <Search className="absolute left-3 top-[11px] w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Rechercher un acte medical ou saisir une description..."
                              value={item.description}
                              onChange={(e) => handleActDescriptionChange(item.id, e.target.value)}
                              onFocus={() => {
                                if (actSuggestions[item.id]?.length) setActiveActDropdown(item.id);
                              }}
                              className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                ie?.description ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                              }`}
                            />
                            {actSearchLoading === item.id && (
                              <Loader2 className="absolute right-3 top-[11px] w-4 h-4 text-blue-500 animate-spin" />
                            )}
                            {activeActDropdown === item.id && actSuggestions[item.id]?.length > 0 && (() => {
                              const suggestions = actSuggestions[item.id];
                              const categories = [...new Set(suggestions.map(a => a.category))];
                              return (
                                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                  {categories.map(cat => (
                                    <div key={cat}>
                                      <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase bg-gray-50 sticky top-0 border-b border-gray-100">
                                        {cat}
                                      </div>
                                      {suggestions.filter(a => a.category === cat).map(act => (
                                        <button
                                          key={act.id}
                                          type="button"
                                          onClick={() => selectMedicalAct(item.id, act)}
                                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                                        >
                                          <span className="font-medium text-gray-900 text-sm">{act.act_name}</span>
                                          <span className="float-right text-xs font-semibold text-blue-600">
                                            {act.price_usd.toFixed(2)} USD
                                            {act.price_cdf > 0 && (
                                              <span className="text-gray-400 font-normal ml-1.5">
                                                ({Number(act.price_cdf).toLocaleString('fr-FR')} CDF)
                                              </span>
                                            )}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  ))}
                                  <div className="px-3 py-1.5 text-[10px] text-gray-300 text-center border-t border-gray-100">
                                    {suggestions.length} resultat(s)
                                  </div>
                                </div>
                              );
                            })()}
                            {ie?.description && (
                              <p className="text-red-500 text-xs mt-1">{ie.description}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Type</label>
                            <select
                              value={item.item_type}
                              onChange={(e) => updateItem(item.id, 'item_type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              {ITEM_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Quantite</label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                  ie?.quantity ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                                }`}
                              />
                              {ie?.quantity && <p className="text-red-500 text-xs mt-1">{ie.quantity}</p>}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Prix unitaire (USD)</label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.unit_price || ''}
                                onChange={(e) => updateItem(item.id, 'unit_price', Math.max(0, parseFloat(e.target.value) || 0))}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                  ie?.unit_price ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                                }`}
                              />
                              {ie?.unit_price && <p className="text-red-500 text-xs mt-1">{ie.unit_price}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Per-line Discount */}
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-xs font-semibold text-gray-500 uppercase">Remise (optionnel)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex rounded-md border border-gray-300 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, 'discount_type', 'fixed')}
                                className={`px-2 py-1 text-xs font-medium transition-colors ${
                                  item.discount_type === 'fixed' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                USD
                              </button>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, 'discount_type', 'percentage')}
                                className={`px-2 py-1 text-xs font-medium transition-colors flex items-center gap-0.5 ${
                                  item.discount_type === 'percentage' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <Percent className="w-3 h-3" />
                              </button>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max={item.discount_type === 'percentage' ? 100 : gross}
                              step="0.01"
                              value={item.discount_value || ''}
                              onChange={(e) => updateItem(item.id, 'discount_value', Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                              placeholder="0"
                            />
                            {discountAmount > 0 && (
                              <span className="text-xs text-orange-600 font-medium">
                                -{discountAmount.toFixed(2)} USD
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Forfait Endoscopie */}
                        {showForfait && (
                          <div className="border-t border-gray-200 pt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-3.5 h-3.5 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-700 uppercase">Forfait endoscopie</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, 'forfait_usd', 0)}
                                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                                  !item.forfait_usd
                                    ? 'bg-gray-200 border-gray-400 text-gray-700 font-semibold'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                                }`}
                              >
                                Aucun
                              </button>
                              {FORFAIT_OPTIONS.map(v => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => updateItem(item.id, 'forfait_usd', v)}
                                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                                    item.forfait_usd === v
                                      ? 'bg-purple-100 border-purple-400 text-purple-700 font-semibold'
                                      : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  {v} USD
                                </button>
                              ))}
                            </div>
                            {item.forfait_usd > 0 && (
                              <p className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded mt-1.5">
                                Forfait : +{item.forfait_usd.toFixed(2)} USD
                              </p>
                            )}
                          </div>
                        )}

                        {/* Medecin Prestataire per line */}
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                            <span className="text-xs font-semibold text-gray-500 uppercase">Medecin prestataire (optionnel)</span>
                          </div>
                          <SearchableSelect
                            value={item.medecin_prestataire_id || ''}
                            onChange={(val) => updateItemPrestataire(item.id, val)}
                            placeholder="-- Aucun --"
                            groups={prestataireGroups}
                          />
                          {item.medecin_prestataire_id && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-500 mb-1">Mode</label>
                                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => updateItem(item.id, 'mode_remuneration', 'pourcentage')}
                                      className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                                        item.mode_remuneration === 'pourcentage' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                      }`}
                                    >
                                      Pourcentage
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateItem(item.id, 'mode_remuneration', 'forfait')}
                                      className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                                        item.mode_remuneration === 'forfait' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                      }`}
                                    >
                                      Forfait
                                    </button>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Valeur {item.mode_remuneration === 'pourcentage' ? '(%)' : '(USD)'}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.mode_remuneration === 'pourcentage' ? 100 : undefined}
                                    step="0.01"
                                    value={item.valeur_remuneration || ''}
                                    onChange={(e) => updateItem(item.id, 'valeur_remuneration', Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  />
                                </div>
                              </div>
                              {item.mode_remuneration === 'pourcentage' && (
                                <div className="flex flex-wrap gap-1.5">
                                  {HONORAIRE_QUICK.map(v => (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => updateItem(item.id, 'valeur_remuneration', v)}
                                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                                        item.valeur_remuneration === v
                                          ? 'bg-teal-100 border-teal-400 text-teal-700 font-semibold'
                                          : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                                      }`}
                                    >
                                      {v}%
                                    </button>
                                  ))}
                                </div>
                              )}
                              {honAmount > 0 && (
                                <p className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded">
                                  Honoraire estime : {honAmount.toFixed(2)} USD
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span className={`text-sm font-semibold ${net > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                            Sous-total: {net.toFixed(2)} USD
                            {(discountAmount > 0 || (item.forfait_usd > 0 && showForfait)) && (
                              <span className="text-xs text-gray-400 font-normal ml-1">
                                (brut: {gross.toFixed(2)}{discountAmount > 0 ? ` -${discountAmount.toFixed(2)}` : ''}{item.forfait_usd > 0 && showForfait ? ` +${item.forfait_usd.toFixed(2)} forfait` : ''})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Medecin Apporteur - Free text with autocomplete */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-700" />
                  <h3 className="text-sm font-semibold text-gray-800">Medecin apporteur (optionnel)</h3>
                </div>
                <div className="relative" ref={apporteurRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Saisir le nom du medecin apporteur..."
                    value={apporteurSearchText}
                    onChange={(e) => handleApporteurTextChange(e.target.value)}
                    onFocus={() => {
                      if (apporteurSearchText.length >= 1 && !medecinApporteurId)
                        setShowApporteurDropdown(true);
                    }}
                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {apporteurSearchText && (
                    <button
                      type="button"
                      onClick={clearApporteur}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showApporteurDropdown && !medecinApporteurId && apporteurSuggestions.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {apporteurSuggestions.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectApporteur(m)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <span className="font-medium text-gray-900">{m.nom_complet}</span>
                          {m.specialite && <span className="text-xs text-gray-400 ml-2">({m.specialite})</span>}
                          <span className="text-xs text-blue-500 ml-2">
                            {m.source === 'interne' ? 'Okapia' : 'Externe'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showApporteurDropdown && !medecinApporteurId && apporteurSearchText.length >= 2 && apporteurSuggestions.length === 0 && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                      <p className="text-xs text-gray-500 text-center">
                        Aucun apporteur enregistre pour "{apporteurSearchText}".
                        Le nom sera saisi librement avec le taux par defaut ({tauxCommissionDefaut}%).
                      </p>
                    </div>
                  )}
                </div>
                {medecinApporteurId && (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Apporteur enregistre — commission selon son taux configure
                  </p>
                )}
                {!medecinApporteurId && apporteurSearchText.trim().length >= 2 && (
                  <p className="text-xs text-amber-600 font-medium">
                    Apporteur libre — taux par defaut: {tauxCommissionDefaut}%
                  </p>
                )}
                {hasApporteur && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Commission (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={pourcentageCommission || ''}
                        onChange={(e) => setPourcentageCommission(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMISSION_QUICK.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPourcentageCommission(v)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                            pourcentageCommission === v
                              ? 'bg-blue-100 border-blue-400 text-blue-700 font-semibold'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                    {totalCommission > 0 && (
                      <p className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        Commission estimee : {totalCommission.toFixed(2)} USD ({pourcentageCommission}% du sous-total)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method & Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mode de paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyTva}
                      onChange={(e) => setApplyTva(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Appliquer la TVA ({TVA_RATE}%)</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Observations ou details supplementaires..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              {/* Totals Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Resume de la facture</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total ({validItemCount} article(s), remises et forfaits inclus)</span>
                    <span className="font-medium text-gray-900">{subtotal.toFixed(2)} USD</span>
                  </div>
                  {applyTva && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA ({TVA_RATE}%)</span>
                      <span className="font-medium text-gray-900">{tvaAmount.toFixed(2)} USD</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">Net a payer</span>
                      <span className="text-xl font-bold text-blue-600">{netToPay.toFixed(2)} USD</span>
                    </div>
                  </div>
                  {(totalHonoraires > 0 || totalCommission > 0) && (
                    <div className="border-t border-dashed border-gray-300 pt-2 mt-2 space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Informations internes</p>
                      {totalHonoraires > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-teal-700">Total honoraires prestataires</span>
                          <span className="font-medium text-teal-700">{totalHonoraires.toFixed(2)} USD</span>
                        </div>
                      )}
                      {totalCommission > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-700">Commission apporteur ({pourcentageCommission}%)</span>
                          <span className="font-medium text-blue-700">{totalCommission.toFixed(2)} USD</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Creer la facture'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
