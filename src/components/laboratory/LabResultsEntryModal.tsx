import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  test_type: string;
  sample_type: string;
  priority: string;
  status: string;
  notes?: string;
  results?: any;
}

interface LabParameter {
  name: string;
  value: string;
  unit: string;
  reference: string;
  isAbnormal?: boolean;
}

interface LabResultsEntryModalProps {
  order: LabOrder;
  onClose: () => void;
  onSave: () => void;
}

export function LabResultsEntryModal({ order, onClose, onSave }: LabResultsEntryModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [parameters, setParameters] = useState<LabParameter[]>([
    { name: 'Hémoglobine', value: '', unit: 'g/dL', reference: '13-17 (H) / 12-16 (F)' },
    { name: 'Leucocytes', value: '', unit: '/mm³', reference: '4000-10000' },
    { name: 'Plaquettes', value: '', unit: '/mm³', reference: '150000-400000' }
  ]);

  const [interpretation, setInterpretation] = useState('');
  const [newStatus, setNewStatus] = useState<'in_progress' | 'completed'>('in_progress');

  useEffect(() => {
    // Charger les résultats existants si disponibles
    if (order.results) {
      try {
        const existingResults = typeof order.results === 'string'
          ? JSON.parse(order.results)
          : order.results;

        if (existingResults.interpretation) {
          setInterpretation(existingResults.interpretation);
        }

        if (existingResults.parameters) {
          setParameters(existingResults.parameters);
        }
      } catch (e) {
        console.error('Error parsing existing results:', e);
      }
    }
  }, [order]);

  const handleParameterChange = (index: number, field: keyof LabParameter, value: string) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const addParameter = () => {
    setParameters([...parameters, {
      name: '',
      value: '',
      unit: '',
      reference: ''
    }]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const results = {
        parameters,
        interpretation,
        enteredBy: profile?.id,
        enteredAt: new Date().toISOString()
      };

      const updateData: any = {
        results: JSON.stringify(results),
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = profile?.id;
      }

      const { error: updateError } = await supabase
        .from('lab_orders')
        .update(updateData)
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Envoyer notification au médecin prescripteur si terminé
      if (newStatus === 'completed') {
        await supabase.from('notifications').insert({
          user_id: order.patient_id, // À adapter selon votre structure
          type: 'lab_results_ready',
          title: 'Résultats d\'analyse disponibles',
          message: `Les résultats pour ${order.test_type} sont disponibles`,
          link: `/laboratory/results/${order.id}`,
          created_at: new Date().toISOString()
        });
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
      console.error('Error saving results:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Saisie des Résultats</h2>
            <p className="text-sm text-gray-600 mt-1">
              Ordre: {order.order_number} - {order.test_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info de l'ordre */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Informations de l'analyse</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Type d'analyse:</span>
                <span className="ml-2 font-medium text-blue-900">{order.test_type}</span>
              </div>
              <div>
                <span className="text-blue-700">Type d'échantillon:</span>
                <span className="ml-2 font-medium text-blue-900">{order.sample_type}</span>
              </div>
              <div>
                <span className="text-blue-700">Priorité:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  order.priority === 'urgent'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.priority === 'urgent' ? 'URGENT' : 'Normal'}
                </span>
              </div>
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <span className="text-blue-700 text-sm">Notes:</span>
                <p className="text-sm text-blue-900 mt-1">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Tableau des paramètres */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Paramètres d'analyse</h3>
              <button
                onClick={addParameter}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Ajouter un paramètre
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Paramètre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Valeur trouvée
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Unité
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Valeur de référence
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parameters.map((param, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Ex: Hémoglobine"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Ex: 13.5"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={param.unit}
                          onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Ex: g/dL"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={param.reference}
                          onChange={(e) => handleParameterChange(index, 'reference', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Ex: 13-17"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeParameter(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zone d'interprétation */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">
              Interprétation du biologiste
            </label>
            <textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Entrez votre interprétation des résultats..."
            />
          </div>

          {/* Sélecteur de statut */}
          <div>
            <label className="block font-semibold text-gray-900 mb-2">
              Statut de l'analyse
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setNewStatus('in_progress')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  newStatus === 'in_progress'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                En cours
              </button>
              <button
                onClick={() => setNewStatus('completed')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  newStatus === 'completed'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Terminé
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Enregistrement...' : 'Enregistrer les résultats'}
          </button>
        </div>
      </div>
    </div>
  );
}
