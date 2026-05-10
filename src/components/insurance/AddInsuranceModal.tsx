import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface AddInsuranceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddInsuranceModal({ onClose, onSuccess }: AddInsuranceModalProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: `INS-${Date.now().toString().slice(-8)}`,
    type: 'mutual' as 'mutual' | 'corporate' | 'government' | 'private',
    contact_email: '',
    contact_phone: '',
    tiers_payant_available: false,
    electronic_billing_enabled: false,
    api_endpoint: '',
    contract_types: [] as string[],
    is_active: true,
  });

  const [contractTypeInput, setContractTypeInput] = useState('');

  useEffect(() => {
    firstInputRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  function validateForm(): boolean {
    if (formData.name.trim().length < 3) {
      setError('Le nom de l\'assurance doit contenir au moins 3 caractères');
      return false;
    }

    if (formData.name.trim().length > 100) {
      setError('Le nom de l\'assurance ne peut pas dépasser 100 caractères');
      return false;
    }

    if (!formData.code.trim()) {
      setError('Le code de l\'assurance est requis');
      return false;
    }

    if (formData.contact_email && !isValidEmail(formData.contact_email)) {
      setError('L\'adresse email n\'est pas valide');
      return false;
    }

    if (formData.electronic_billing_enabled && formData.api_endpoint && !isValidUrl(formData.api_endpoint)) {
      setError('L\'URL de l\'API n\'est pas valide');
      return false;
    }

    return true;
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function checkCodeExists(code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('insurance_providers')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Error checking code:', error);
      return false;
    }

    return !!data;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const codeExists = await checkCodeExists(formData.code);
      if (codeExists) {
        setError('Ce code d\'assurance existe déjà. Veuillez en choisir un autre.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('insurance_providers')
        .insert([{
          name: formData.name.trim(),
          code: formData.code.trim(),
          type: formData.type,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          tiers_payant_available: formData.tiers_payant_available,
          electronic_billing_enabled: formData.electronic_billing_enabled,
          api_endpoint: formData.api_endpoint.trim() || null,
          contract_types: formData.contract_types.length > 0 ? formData.contract_types : null,
          is_active: formData.is_active,
        }]);

      if (insertError) throw insertError;

      success('Assurance ajoutée avec succès');
      onSuccess();
    } catch (err: any) {
      console.error('Error adding insurance:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'ajout de l\'assurance');
      showError('Erreur lors de l\'ajout de l\'assurance');
    } finally {
      setLoading(false);
    }
  }

  function handleAddContractType() {
    if (contractTypeInput.trim() && !formData.contract_types.includes(contractTypeInput.trim())) {
      setFormData({
        ...formData,
        contract_types: [...formData.contract_types, contractTypeInput.trim()],
      });
      setContractTypeInput('');
    }
  }

  function handleRemoveContractType(type: string) {
    setFormData({
      ...formData,
      contract_types: formData.contract_types.filter(t => t !== type),
    });
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-insurance-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h2 id="add-insurance-title" className="text-2xl font-bold text-gray-900">
              Ajouter une Assurance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer le modal"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'Assurance <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: SONAS, CNSS, etc."
                    minLength={3}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="INS-XXXXXXXX"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'Assurance <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="mutual">Mutuelle</option>
                    <option value="corporate">Entreprise</option>
                    <option value="government">Gouvernement</option>
                    <option value="private">Privé</option>
                  </select>
                </div>

                <div className="flex items-center pt-8">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Assurance Active
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Contact
                  </label>
                  <input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@assurance.com"
                  />
                </div>

                <div>
                  <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone de Contact
                  </label>
                  <input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+243 XXX XXX XXX"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres Avancés</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="tiers_payant"
                    type="checkbox"
                    checked={formData.tiers_payant_available}
                    onChange={(e) => setFormData({ ...formData, tiers_payant_available: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="tiers_payant" className="ml-2 text-sm font-medium text-gray-700">
                    Tiers Payant Disponible
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="electronic_billing"
                    type="checkbox"
                    checked={formData.electronic_billing_enabled}
                    onChange={(e) => setFormData({ ...formData, electronic_billing_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="electronic_billing" className="ml-2 text-sm font-medium text-gray-700">
                    Facturation Électronique Activée
                  </label>
                </div>

                {formData.electronic_billing_enabled && (
                  <div>
                    <label htmlFor="api_endpoint" className="block text-sm font-medium text-gray-700 mb-2">
                      Point d'Accès API
                    </label>
                    <input
                      id="api_endpoint"
                      type="url"
                      value={formData.api_endpoint}
                      onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://api.assurance.com/billing"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="contract_type_input" className="block text-sm font-medium text-gray-700 mb-2">
                    Types de Contrat
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="contract_type_input"
                      type="text"
                      value={contractTypeInput}
                      onChange={(e) => setContractTypeInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddContractType();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Individuel, Familial, Groupe"
                    />
                    <button
                      type="button"
                      onClick={handleAddContractType}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                  {formData.contract_types.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.contract_types.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {type}
                          <button
                            type="button"
                            onClick={() => handleRemoveContractType(type)}
                            className="hover:text-blue-900"
                            aria-label={`Supprimer ${type}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                'Ajouter l\'Assurance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
