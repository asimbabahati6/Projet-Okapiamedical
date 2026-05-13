import { useState, useEffect } from 'react';
import { X, Pill } from 'lucide-react';
import type { MedicationFormData, MedicationCategory, DosageForm } from '../../types/pharmacy';
import { createMedication, generateMedicationCode } from '../../services/pharmacyService';
import { useToast } from '../../hooks/useToast';

interface AddMedicationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: MedicationCategory[] = [
  'Antibiotique', 'Antalgique', 'Anti-inflammatoire', 'Cardiovasculaire',
  'Antidiabétique', 'Antiparasitaire', 'Gastro-intestinal', 'Respiratoire',
  'Vitamine', 'Dermatologie', 'Neurologique', 'Obstétrique', 'Ophtalmologie', 'Autre'
];

const FORMS: DosageForm[] = [
  'Comprimé', 'Gélule', 'Sirop', 'Injectable', 'Suppositoire',
  'Pommade', 'Solution', 'Spray', 'Crème', 'Collyre', 'Inhalateur', 'Poudre'
];

export function AddMedicationModal({ onClose, onSuccess }: AddMedicationModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicationFormData>({
    code: '',
    name: '',
    generic_name: '',
    category: 'Antibiotique',
    dosage: '',
    form: 'Comprimé',
    unit_price: 0,
    current_stock: 0,
    minimum_stock: 20,
    maximum_stock: 500,
    expiry_date: '',
    manufacturer: '',
    batch_number: '',
    storage_conditions: 'Température ambiante',
    requires_prescription: false
  });

  useEffect(() => {
    generateMedicationCode().then(code => {
      setFormData(prev => ({ ...prev, code }));
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createMedication(formData);
      showToast('Médicament ajouté avec succès', 'success');
      onSuccess();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'ajout', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (parseFloat(value) || 0) : value
    }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
              <Pill className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Ajouter un médicament</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Identification */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Amoxicilline 500mg"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DCI (nom générique)</label>
                <input
                  type="text"
                  name="generic_name"
                  value={formData.generic_name || ''}
                  onChange={handleChange}
                  placeholder="Ex: Amoxicillin"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forme <span className="text-red-500">*</span>
                </label>
                <select
                  name="form"
                  value={formData.form}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 500mg"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Stock & Prix */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Stock & Prix</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix unitaire ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="unit_price"
                  value={formData.unit_price || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock initial <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  name="current_stock"
                  value={formData.current_stock || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock minimum</label>
                <input
                  type="number"
                  min="0"
                  name="minimum_stock"
                  value={formData.minimum_stock || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock maximum</label>
                <input
                  type="number"
                  min="0"
                  name="maximum_stock"
                  value={formData.maximum_stock || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Lot & Expiration */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Lot & Conservation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de lot</label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number || ''}
                  onChange={handleChange}
                  placeholder="Ex: LOT-2024-A001"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fabricant</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={handleChange}
                  placeholder="Ex: Sanofi"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de conservation</label>
                <select
                  name="storage_conditions"
                  value={formData.storage_conditions || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="Température ambiante">Température ambiante</option>
                  <option value="Réfrigérateur 2-8°C">Réfrigérateur 2-8°C</option>
                  <option value="Protéger de la lumière">Protéger de la lumière</option>
                  <option value="Conserver au sec">Conserver au sec</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requires_prescription"
                    checked={formData.requires_prescription}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Nécessite une ordonnance
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le médicament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
