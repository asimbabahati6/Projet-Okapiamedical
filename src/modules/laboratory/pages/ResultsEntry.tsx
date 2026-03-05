import React, { useState } from 'react';
import { FlaskConical, User, Calendar, Save, FileSignature, Plus, Trash2 } from 'lucide-react';

interface InProgressAnalysis {
  id: string;
  patient_name: string;
  patient_id: string;
  test_type: string;
  requested_date: string;
  priority: 'normal' | 'urgent';
}

interface TestParameter {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  reference_range: string;
}

const mockInProgressAnalyses: InProgressAnalysis[] = [
  {
    id: 'a1',
    patient_name: 'Mbuyi Grace',
    patient_id: 'P-2026-001',
    test_type: 'Bilan hépatique complet',
    requested_date: '2026-02-27',
    priority: 'normal'
  },
  {
    id: 'a2',
    patient_name: 'Kabongo Daniel',
    patient_id: 'P-2026-002',
    test_type: 'Électrolytes (Na, K, Cl)',
    requested_date: '2026-02-27',
    priority: 'urgent'
  },
  {
    id: 'a3',
    patient_name: 'Mbala Josephine',
    patient_id: 'P-2026-003',
    test_type: 'NFS (Numération Formule Sanguine)',
    requested_date: '2026-02-27',
    priority: 'urgent'
  }
];

const defaultParameters: Record<string, TestParameter[]> = {
  'Bilan hépatique complet': [
    { id: 'p1', parameter: 'ALAT (TGP)', value: '', unit: 'UI/L', reference_range: '10-40' },
    { id: 'p2', parameter: 'ASAT (TGO)', value: '', unit: 'UI/L', reference_range: '10-35' },
    { id: 'p3', parameter: 'Bilirubine totale', value: '', unit: 'mg/dL', reference_range: '0.3-1.2' },
    { id: 'p4', parameter: 'Phosphatase alcaline', value: '', unit: 'UI/L', reference_range: '30-120' }
  ],
  'Électrolytes (Na, K, Cl)': [
    { id: 'p1', parameter: 'Sodium (Na)', value: '', unit: 'mmol/L', reference_range: '135-145' },
    { id: 'p2', parameter: 'Potassium (K)', value: '', unit: 'mmol/L', reference_range: '3.5-5.0' },
    { id: 'p3', parameter: 'Chlore (Cl)', value: '', unit: 'mmol/L', reference_range: '98-106' }
  ],
  'NFS (Numération Formule Sanguine)': [
    { id: 'p1', parameter: 'Globules rouges', value: '', unit: '×10⁶/µL', reference_range: '4.5-5.5' },
    { id: 'p2', parameter: 'Hémoglobine', value: '', unit: 'g/dL', reference_range: '13-17' },
    { id: 'p3', parameter: 'Hématocrite', value: '', unit: '%', reference_range: '40-50' },
    { id: 'p4', parameter: 'Globules blancs', value: '', unit: '×10³/µL', reference_range: '4-10' },
    { id: 'p5', parameter: 'Plaquettes', value: '', unit: '×10³/µL', reference_range: '150-400' }
  ]
};

export const ResultsEntry: React.FC = () => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<InProgressAnalysis | null>(null);
  const [parameters, setParameters] = useState<TestParameter[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelectAnalysis = (analysis: InProgressAnalysis) => {
    setSelectedAnalysis(analysis);
    setParameters(defaultParameters[analysis.test_type] || []);
    setConclusion('');
  };

  const handleParameterChange = (id: string, field: keyof TestParameter, value: string) => {
    setParameters(params =>
      params.map(param =>
        param.id === id ? { ...param, [field]: value } : param
      )
    );
  };

  const handleAddParameter = () => {
    const newParam: TestParameter = {
      id: `p${parameters.length + 1}`,
      parameter: '',
      value: '',
      unit: '',
      reference_range: ''
    };
    setParameters([...parameters, newParam]);
  };

  const handleRemoveParameter = (id: string) => {
    setParameters(params => params.filter(param => param.id !== id));
  };

  const handleValidateAndSign = async () => {
    if (!selectedAnalysis) return;

    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      alert(`Résultats validés et signés pour ${selectedAnalysis.patient_name}`);
      setSelectedAnalysis(null);
      setParameters([]);
      setConclusion('');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Saisie des Résultats</h1>
        <p className="text-gray-600 mt-2">Enregistrez les résultats d'analyses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyses en cours</h3>
            <div className="space-y-3">
              {mockInProgressAnalyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => handleSelectAnalysis(analysis)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnalysis?.id === analysis.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900">{analysis.patient_name}</p>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        analysis.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {analysis.priority === 'urgent' ? 'URGENT' : 'Normal'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{analysis.test_type}</p>
                  <p className="text-xs text-gray-500">{analysis.patient_id}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedAnalysis ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Informations du patient</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Patient</p>
                      <p className="font-medium text-gray-900">{selectedAnalysis.patient_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date demande</p>
                      <p className="font-medium text-gray-900">{selectedAnalysis.requested_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FlaskConical className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Type d'examen</p>
                      <p className="font-medium text-gray-900">{selectedAnalysis.test_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileSignature className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">ID Patient</p>
                      <p className="font-medium text-gray-900">{selectedAnalysis.patient_id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Paramètres d'analyse</h3>
                  <button
                    onClick={handleAddParameter}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter paramètre
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paramètre
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valeur
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unité
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plage de référence
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parameters.map((param) => (
                        <tr key={param.id}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={param.parameter}
                              onChange={(e) => handleParameterChange(param.id, 'parameter', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Nom du paramètre"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => handleParameterChange(param.id, 'value', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Valeur"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={param.unit}
                              onChange={(e) => handleParameterChange(param.id, 'unit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Unité"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={param.reference_range}
                              onChange={(e) => handleParameterChange(param.id, 'reference_range', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Min-Max"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRemoveParameter(param.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conclusion du biologiste
                </label>
                <textarea
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Saisissez votre interprétation et conclusion..."
                />
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={() => {
                    setSelectedAnalysis(null);
                    setParameters([]);
                    setConclusion('');
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleValidateAndSign}
                  disabled={saving || parameters.some(p => !p.value)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSignature className="w-5 h-5" />
                  {saving ? 'Validation en cours...' : 'Valider et Signer'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Sélectionnez une analyse</h2>
              <p className="text-gray-600">
                Choisissez une analyse en cours dans la liste de gauche pour commencer la saisie des résultats
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
