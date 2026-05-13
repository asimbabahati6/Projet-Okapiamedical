import { useState, useEffect } from 'react';
import { X, TestTube, Search, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface CreateLabOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedPatientId?: string;
}

interface Patient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
}

interface LabTest {
  id: string;
  test_code: string;
  test_name: string;
  test_category: string;
  requires_fasting: boolean;
  sample_type: string;
  turnaround_time_hours: number;
  price: number;
}

export function CreateLabOrderModal({ onClose, onSuccess, preselectedPatientId }: CreateLabOrderModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(preselectedPatientId || '');
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPatients();
    loadAvailableTests();
  }, []);

  async function loadPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('id, patient_number, first_name, last_name')
      .order('last_name');

    if (!error && data) {
      setPatients(data);
    }
  }

  async function loadAvailableTests() {
    const { data, error } = await supabase
      .from('lab_tests')
      .select('*')
      .eq('is_active', true)
      .order('category, test_name');

    if (!error && data) {
      setAvailableTests(data.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        test_code: t.test_code as string,
        test_name: t.test_name as string,
        test_category: t.category as string,
        requires_fasting: false,
        sample_type: (t.specimen_type as string) || '',
        turnaround_time_hours: (t.turnaround_time as number) || 24,
        price: (t.price as number) || 0,
      })));
    }
  }

  function handleAddTest(test: LabTest) {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
  }

  function handleRemoveTest(testId: string) {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  }

  async function handleSubmit() {
    if (!selectedPatient) {
      showToast('Veuillez sélectionner un patient', 'error');
      return;
    }

    if (selectedTests.length === 0) {
      showToast('Veuillez sélectionner au moins un test', 'error');
      return;
    }

    setLoading(true);

    try {
      const orderNumber = `LAB-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const insertPromises = selectedTests.map((test) =>
        supabase.from('lab_orders').insert({
          order_number: `${orderNumber}-${test.test_code}`,
          patient_id: selectedPatient,
          test_id: test.id,
          priority,
          status: 'pending',
          notes: clinicalNotes || null,
        })
      );

      const results = await Promise.all(insertPromises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;

      showToast('Commande de laboratoire créée avec succès', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating lab order:', error);
      showToast('Erreur lors de la création de la commande', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredTests = availableTests.filter(test =>
    test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.test_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.test_category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCost = selectedTests.reduce((sum, test) => sum + test.price, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center gap-3">
            <TestTube className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Nouvelle Commande de Laboratoire</h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient *
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={!!preselectedPatientId}
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_number} - {patient.first_name} {patient.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT (Immédiat)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes Cliniques
              </label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Informations cliniques pertinentes pour le laboratoire..."
              />
            </div>

            {selectedTests.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  Tests Sélectionnés ({selectedTests.length})
                </h3>
                <div className="space-y-2">
                  {selectedTests.map((test) => (
                    <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{test.test_name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500">Code: {test.test_code}</p>
                          <p className="text-sm text-gray-500">Catégorie: {test.test_category}</p>
                          {test.requires_fasting && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              À jeun requis
                            </span>
                          )}
                          <p className="text-sm font-medium text-green-600">{test.price.toFixed(2)} €</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveTest(test.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
                  <span className="font-medium text-gray-700">Coût Total:</span>
                  <span className="text-lg font-bold text-green-600">{totalCost.toFixed(2)} €</span>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ajouter des Tests</h3>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, code ou catégorie..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredTests.map((test) => (
                  <div
                    key={test.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedTests.find(t => t.id === test.id)
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{test.test_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-500">{test.test_code}</p>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {test.test_category}
                          </span>
                          <p className="text-xs text-gray-500">{test.sample_type}</p>
                          <p className="text-xs font-medium text-green-600">{test.price.toFixed(2)} €</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddTest(test)}
                        disabled={!!selectedTests.find(t => t.id === test.id)}
                        className={`p-2 rounded transition-colors ${
                          selectedTests.find(t => t.id === test.id)
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {priority !== 'routine' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    {priority === 'stat' ? 'Commande STAT' : 'Commande Urgente'}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Cette commande sera traitée en priorité par le laboratoire.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedPatient || selectedTests.length === 0}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création...' : 'Créer la Commande'}
          </button>
        </div>
      </div>
    </div>
  );
}
