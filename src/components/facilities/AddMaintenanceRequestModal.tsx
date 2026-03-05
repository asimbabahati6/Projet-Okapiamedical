import { useState } from 'react';
import { X, Wrench, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface AddMaintenanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMaintenanceRequestModal({
  isOpen,
  onClose,
  onSuccess
}: AddMaintenanceRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    request_type: 'maintenance',
    location: '',
    description: '',
    priority: 'medium',
    estimated_cost_cdf: '',
    estimated_cost_usd: '',
    scheduled_date: '',
    notes: ''
  });

  const requestTypes = [
    { value: 'repair', label: 'Réparation' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'upgrade', label: 'Mise à niveau' },
    { value: 'emergency', label: 'Urgence' }
  ];

  const priorities = [
    { value: 'low', label: 'Faible', color: 'text-gray-600' },
    { value: 'medium', label: 'Moyenne', color: 'text-blue-600' },
    { value: 'high', label: 'Haute', color: 'text-orange-600' },
    { value: 'emergency', label: 'Urgence', color: 'text-red-600' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.location.trim() || !formData.description.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const requestData = {
        request_type: formData.request_type,
        location: formData.location.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        estimated_cost_cdf: formData.estimated_cost_cdf ? parseFloat(formData.estimated_cost_cdf) : null,
        estimated_cost_usd: formData.estimated_cost_usd ? parseFloat(formData.estimated_cost_usd) : null,
        scheduled_date: formData.scheduled_date || null,
        notes: formData.notes.trim() || null,
        status: 'pending',
        requested_by: user?.id
      };

      const { error } = await supabase
        .from('facility_maintenance_requests')
        .insert([requestData]);

      if (error) throw error;

      showToast('Demande de maintenance créée avec succès', 'success');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      showToast('Erreur lors de la création de la demande', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      request_type: 'maintenance',
      location: '',
      description: '',
      priority: 'medium',
      estimated_cost_cdf: '',
      estimated_cost_usd: '',
      scheduled_date: '',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Nouvelle Demande de Maintenance</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de demande <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.request_type}
                onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {requestTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value} className={priority.color}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emplacement <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Salle d'urgence, Bâtiment A - 2ème étage"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez le problème ou la demande de maintenance en détail..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coût estimé (CDF)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_cost_cdf}
                onChange={(e) => setFormData({ ...formData, estimated_cost_cdf: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coût estimé (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_cost_usd}
                onChange={(e) => setFormData({ ...formData, estimated_cost_usd: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date planifiée
            </label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes additionnelles
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {formData.priority === 'emergency' && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Demande d'urgence</p>
                <p className="text-sm text-red-600 mt-1">
                  Cette demande sera traitée en priorité et nécessitera une attention immédiate.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Créer la demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
