import { useState, useEffect } from 'react';
import { X, DollarSign, Upload, Search, User, Building2, Link2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface EtatReference {
  reference_etat: string;
  medecin_nom: string;
  total_du: number;
  count: number;
}

interface Department {
  id: string;
  name: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ value: string; label: string; icon: string }>;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Especes' },
  { value: 'bank_transfer', label: 'Virement Bancaire' },
  { value: 'check', label: 'Cheque' },
  { value: 'card', label: 'Carte' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
}: AddExpenseModalProps) {
  const { profile } = useAuth();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    vendor: '',
    receipt_number: '',
    notes: '',
    beneficiaire_type: 'externe' as 'interne' | 'externe',
    beneficiaire_id: '',
    beneficiaire_nom: '',
    type_paiement_lie: '' as '' | 'honoraire' | 'commission',
    reference_etat_selected: '',
    service_destinataire_id: '',
    piece_justificative_ref: '',
  });

  const [departments, setDepartments] = useState<Department[]>([]);

  const [etatReferences, setEtatReferences] = useState<EtatReference[]>([]);
  const [etatSearch, setEtatSearch] = useState('');
  const [loadingEtats, setLoadingEtats] = useState(false);

  const [staffSearch, setStaffSearch] = useState('');
  const [staffResults, setStaffResults] = useState<Array<{ id: string; full_name: string }>>([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [selectedStaffName, setSelectedStaffName] = useState('');

  useEffect(() => {
    async function loadDepartments() {
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setDepartments(data || []);
    }
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!formData.type_paiement_lie) {
      setEtatReferences([]);
      return;
    }
    async function loadEtats() {
      setLoadingEtats(true);
      try {
        const table = formData.type_paiement_lie === 'honoraire' ? 'honoraires_medecins' : 'commissions_medecins';
        const { data } = await supabase
          .from(table)
          .select('reference_etat, montant_du, medecins_prestataires(nom_complet)')
          .eq('statut_paiement', 'non_paye')
          .not('reference_etat', 'is', null);

        if (data) {
          const map = new Map<string, EtatReference>();
          for (const row of data) {
            const ref = row.reference_etat as string;
            const med = (row.medecins_prestataires as { nom_complet: string } | null)?.nom_complet || '';
            const existing = map.get(ref);
            if (existing) {
              existing.total_du += Number(row.montant_du || 0);
              existing.count++;
            } else {
              map.set(ref, {
                reference_etat: ref,
                medecin_nom: med,
                total_du: Number(row.montant_du || 0),
                count: 1,
              });
            }
          }
          setEtatReferences(Array.from(map.values()));
        }
      } catch (err) {
        console.error('Error loading etat references:', err);
      } finally {
        setLoadingEtats(false);
      }
    }
    loadEtats();
  }, [formData.type_paiement_lie]);

  useEffect(() => {
    if (staffSearch.length < 2 || formData.beneficiaire_type !== 'interne') {
      setStaffResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .ilike('full_name', `%${staffSearch}%`)
        .eq('account_status', 'active')
        .limit(8);
      setStaffResults(data || []);
      setShowStaffDropdown(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [staffSearch, formData.beneficiaire_type]);

  const selectStaff = (staff: { id: string; full_name: string }) => {
    setFormData({ ...formData, beneficiaire_id: staff.id });
    setSelectedStaffName(staff.full_name);
    setStaffSearch(staff.full_name);
    setShowStaffDropdown(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.category || !formData.amount || !formData.description || !formData.service_destinataire_id || !formData.piece_justificative_ref.trim()) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!profile?.id) {
      showError('Utilisateur non identifie');
      return;
    }

    setLoading(true);

    try {
      const insertData: Record<string, unknown> = {
        category: formData.category,
        subcategory: formData.subcategory || null,
        amount: parseFloat(formData.amount),
        description: formData.description,
        expense_date: formData.expense_date,
        payment_method: formData.payment_method,
        vendor: formData.vendor || null,
        receipt_number: formData.receipt_number || null,
        notes: formData.notes || null,
        created_by: profile.id,
        beneficiaire_type: formData.beneficiaire_type,
        beneficiaire_id: formData.beneficiaire_type === 'interne' && formData.beneficiaire_id ? formData.beneficiaire_id : null,
        beneficiaire_nom: formData.beneficiaire_type === 'externe' && formData.beneficiaire_nom ? formData.beneficiaire_nom : null,
        type_paiement_lie: formData.type_paiement_lie || null,
        service_destinataire_id: formData.service_destinataire_id || null,
        piece_justificative_ref: formData.piece_justificative_ref.trim(),
      };

      const { data: expenseData, error } = await supabase
        .from('expenses')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;

      if (formData.type_paiement_lie && formData.reference_etat_selected && expenseData) {
        const table = formData.type_paiement_lie === 'honoraire' ? 'honoraires_medecins' : 'commissions_medecins';
        const { error: updateErr } = await supabase
          .from(table)
          .update({
            statut_paiement: 'paye',
            paye_le: new Date().toISOString(),
            depense_id: expenseData.id,
          })
          .eq('reference_etat', formData.reference_etat_selected)
          .eq('statut_paiement', 'non_paye');

        if (updateErr) {
          console.error('Error marking etat as paid:', updateErr);
        }
      }

      onSuccess();
    } catch (err) {
      console.error('Error creating expense:', err);
      showError('Erreur lors de la creation de la depense');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nouvelle Depense</h2>
              <p className="text-sm text-gray-600">Enregistrer une depense operationnelle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selectionner une categorie</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sous-categorie
              </label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Precision optionnelle"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Details de la depense..."
              required
            />
          </div>

          {/* Service destinataire & Piece justificative - MANDATORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service destinataire <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service_destinataire_id}
                onChange={(e) => setFormData({ ...formData, service_destinataire_id: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !formData.service_destinataire_id ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                }`}
                required
              >
                <option value="">-- Selectionner un service --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {!formData.service_destinataire_id && (
                <p className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Ce champ est obligatoire pour enregistrer la depense
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Piece justificative (reference) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.piece_justificative_ref}
                onChange={(e) => setFormData({ ...formData, piece_justificative_ref: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !formData.piece_justificative_ref.trim() ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                }`}
                placeholder="Ex: BC-2025-042, FAC-00123, ORD-..."
                required
              />
              {!formData.piece_justificative_ref.trim() && (
                <p className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Reference de la piece justificative obligatoire
                </p>
              )}
            </div>
          </div>

          {/* Payment Link Section */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-amber-600" />
              Lier a un etat d'honoraires ou commissions
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type_paiement_lie: '', reference_etat_selected: '' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !formData.type_paiement_lie
                    ? 'bg-gray-700 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Aucun
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type_paiement_lie: 'honoraire', reference_etat_selected: '' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.type_paiement_lie === 'honoraire'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Honoraire (HON-)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type_paiement_lie: 'commission', reference_etat_selected: '' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.type_paiement_lie === 'commission'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Commission (COM-)
              </button>
            </div>

            {formData.type_paiement_lie && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference de l'etat a payer
                </label>
                {loadingEtats ? (
                  <p className="text-sm text-gray-500">Chargement des etats...</p>
                ) : etatReferences.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun etat en attente de paiement</p>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Rechercher une reference..."
                      value={etatSearch}
                      onChange={(e) => setEtatSearch(e.target.value)}
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {etatReferences
                        .filter(
                          (e) =>
                            e.reference_etat.toLowerCase().includes(etatSearch.toLowerCase()) ||
                            e.medecin_nom.toLowerCase().includes(etatSearch.toLowerCase())
                        )
                        .map((e) => (
                          <button
                            key={e.reference_etat}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                reference_etat_selected: e.reference_etat,
                                amount: String(e.total_du),
                                description: `Paiement ${formData.type_paiement_lie === 'honoraire' ? 'honoraires' : 'commission'} - ${e.reference_etat} - ${e.medecin_nom}`,
                                beneficiaire_type: 'interne',
                              });
                              setEtatSearch('');
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors flex items-center justify-between ${
                              formData.reference_etat_selected === e.reference_etat ? 'bg-amber-100' : ''
                            }`}
                          >
                            <div>
                              <span className="font-mono text-sm font-semibold text-gray-900">{e.reference_etat}</span>
                              <p className="text-xs text-gray-500 mt-0.5">{e.medecin_nom} - {e.count} ligne{e.count > 1 ? 's' : ''}</p>
                            </div>
                            <span className="font-bold text-gray-900">{e.total_du.toLocaleString('fr-FR')} USD</span>
                          </button>
                        ))}
                    </div>
                    {formData.reference_etat_selected && (
                      <p className="mt-2 text-sm text-green-700 font-medium flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5" />
                        Lie a : {formData.reference_etat_selected}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Beneficiary Section */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Beneficiaire</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, beneficiaire_type: 'interne', beneficiaire_nom: '' });
                  setStaffSearch('');
                  setSelectedStaffName('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.beneficiaire_type === 'interne'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4" />
                Employe interne
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, beneficiaire_type: 'externe', beneficiaire_id: '' });
                  setStaffSearch('');
                  setSelectedStaffName('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.beneficiaire_type === 'externe'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Externe / Tiers
              </button>
            </div>

            {formData.beneficiaire_type === 'interne' ? (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher un employe
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => {
                      setStaffSearch(e.target.value);
                      if (selectedStaffName && e.target.value !== selectedStaffName) {
                        setFormData({ ...formData, beneficiaire_id: '' });
                        setSelectedStaffName('');
                      }
                    }}
                    onFocus={() => staffResults.length > 0 && setShowStaffDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nom de l'employe..."
                  />
                </div>
                {showStaffDropdown && staffResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {staffResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectStaff(s)}
                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50 text-sm flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        {s.full_name}
                      </button>
                    ))}
                  </div>
                )}
                {selectedStaffName && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Selectionne : {selectedStaffName}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du beneficiaire externe
                </label>
                <input
                  type="text"
                  value={formData.beneficiaire_nom}
                  onChange={(e) => setFormData({ ...formData, beneficiaire_nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom du fournisseur, prestataire, tiers..."
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom du fournisseur"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Methode de Paiement
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numero de Recu/Facture
            </label>
            <input
              type="text"
              value={formData.receipt_number}
              onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="REC-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes Additionnelles
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Remarques ou informations supplementaires..."
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Joindre un Recu ou une Facture
            </p>
            <p className="text-xs text-gray-500">
              (Fonctionnalite a venir)
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.service_destinataire_id || !formData.piece_justificative_ref.trim()}
            >
              {loading ? 'Enregistrement...' : !formData.service_destinataire_id || !formData.piece_justificative_ref.trim() ? 'Champs obligatoires manquants' : 'Enregistrer la Depense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
