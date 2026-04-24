import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MedicationFormData, MedicationCategory, DosageForm } from '../../types/pharmacy';
import { createMedication, generateMedicationCode } from '../../services/pharmacyService';
import { useToast } from '../../hooks/useToast';

interface AddMedicationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMedicationModal({ onClose, onSuccess }: AddMedicationModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicationFormData>({
    medication_code: '',
    generic_name: '',
    brand_name: '',
    category: 'Antibiotique' as MedicationCategory,
    dosage_form: 'Comprimé' as DosageForm,
    strength: '',
    unit_price: 0,
    quantity_in_stock: 0,
    reorder_level: 20,
    supplier: '',
    is_controlled_substance: false,
    is_active: true,
    batch_number: '',
    manufacture_date: '',
    expiry_date: ''
  });

  useEffect(() => {
    loadMedicationCode();
  }, []);

  async function loadMedicationCode() {
    try {
      const code = await generateMedicationCode();
      setFormData(prev => ({ ...prev, medication_code: code }));
    } catch (error) {
      console.error('Error generating code:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createMedication(formData);
      showToast('Médicament ajouté avec succès', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding medication:', error);
      showToast(error.message || 'Erreur lors de l\'ajout du médicament', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    const name = target.name;

    if (target.type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Ajouter un Médicament</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du Médicament</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Médicament
                  </label>
                  <input
                    type="text"
                    name="medication_code"
                    value={formData.medication_code}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom Générique <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="generic_name"
                    value={formData.generic_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom Commercial
                  </label>
                  <input
                    type="text"
                    name="brand_name"
                    value={formData.brand_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Antibiotique">Antibiotique</option>
                    <option value="Antalgique">Antalgique</option>
                    <option value="Anti-inflammatoire">Anti-inflammatoire</option>
                    <option value="Antipyrétique">Antipyrétique</option>
                    <option value="Antihypertenseur">Antihypertenseur</option>
                    <option value="Antidiabétique">Antidiabétique</option>
                    <option value="Antipaludéen">Antipaludéen</option>
                    <option value="Vitamines">Vitamines</option>
                    <option value="Supplément">Supplément</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forme Galénique <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="dosage_form"
                    value={formData.dosage_form || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Comprimé">Comprimé</option>
                    <option value="Gélule">Gélule</option>
                    <option value="Sirop">Sirop</option>
                    <option value="Suspension">Suspension</option>
                    <option value="Solution injectable">Solution injectable</option>
                    <option value="Pommade">Pommade</option>
                    <option value="Crème">Crème</option>
                    <option value="Gouttes">Gouttes</option>
                    <option value="Inhalateur">Inhalateur</option>
                    <option value="Suppositoire">Suppositoire</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="strength"
                    value={formData.strength}
                    onChange={handleChange}
                    required
                    placeholder="Ex: 500mg, 10ml"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock et Prix</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix Unitaire (CDF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="unit_price"
                    value={formData.unit_price || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité en Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="quantity_in_stock"
                    value={formData.quantity_in_stock || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seuil de Réapprovisionnement
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="reorder_level"
                    value={formData.reorder_level || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du Lot (Optionnel)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de Lot
                  </label>
                  <input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number || ''}
                    onChange={handleChange}
                    placeholder="Ex: LOT2024001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de Fabrication
                  </label>
                  <input
                    type="date"
                    name="manufacture_date"
                    value={formData.manufacture_date || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'Expiration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_controlled_substance"
                      checked={formData.is_controlled_substance}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Substance Contrôlée (nécessite prescription spéciale)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
