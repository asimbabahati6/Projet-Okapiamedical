import { useState, useEffect } from 'react';
import { X, DollarSign, Upload, Search, User, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

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
  });

  const [staffSearch, setStaffSearch] = useState('');
  const [staffResults, setStaffResults] = useState<Array<{ id: string; full_name: string }>>([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [selectedStaffName, setSelectedStaffName] = useState('');

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

    if (!formData.category || !formData.amount || !formData.description) {
      showError('Veuillez remplir tous les champs requis');
      return;
    }

    if (!profile?.id) {
      showError('Utilisateur non identifie');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('expenses').insert({
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
      });

      if (error) throw error;

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
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer la Depense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
