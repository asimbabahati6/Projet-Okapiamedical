import React, { useState, useMemo } from 'react';
import { History, Search, Calendar, Download, FileText, CheckCircle2 } from 'lucide-react';

interface CompletedAnalysis {
  id: string;
  patient_name: string;
  patient_id: string;
  test_type: string;
  completed_date: string;
  completed_by: string;
  result_summary: string;
}

const mockCompletedAnalyses: CompletedAnalysis[] = [
  {
    id: 'h1',
    patient_name: 'Lumba Antoine',
    patient_id: 'P-2026-010',
    test_type: 'Glycémie à jeun',
    completed_date: '2026-02-27',
    completed_by: 'Dr. Katanga',
    result_summary: 'Glycémie normale (5.2 mmol/L)'
  },
  {
    id: 'h2',
    patient_name: 'Nzeba Sarah',
    patient_id: 'P-2026-011',
    test_type: 'NFS (Numération Formule Sanguine)',
    completed_date: '2026-02-26',
    completed_by: 'Dr. Katanga',
    result_summary: 'Hémogramme dans les normes'
  },
  {
    id: 'h3',
    patient_name: 'Mukendi Pascal',
    patient_id: 'P-2026-012',
    test_type: 'Créatinine sérique',
    completed_date: '2026-02-26',
    completed_by: 'Dr. Mwamba',
    result_summary: 'Fonction rénale normale (0.9 mg/dL)'
  },
  {
    id: 'h4',
    patient_name: 'Tshala Beatrice',
    patient_id: 'P-2026-013',
    test_type: 'Test VIH (Dépistage)',
    completed_date: '2026-02-25',
    completed_by: 'Dr. Katanga',
    result_summary: 'Résultat négatif'
  },
  {
    id: 'h5',
    patient_name: 'Kabamba Maurice',
    patient_id: 'P-2026-014',
    test_type: 'Bilan hépatique complet',
    completed_date: '2026-02-25',
    completed_by: 'Dr. Mwamba',
    result_summary: 'Transaminases légèrement élevées'
  },
  {
    id: 'h6',
    patient_name: 'Nkongolo Rachel',
    patient_id: 'P-2026-015',
    test_type: 'Paludisme (Test rapide)',
    completed_date: '2026-02-24',
    completed_by: 'Dr. Katanga',
    result_summary: 'Plasmodium falciparum positif'
  },
  {
    id: 'h7',
    patient_name: 'Ilunga Martin',
    patient_id: 'P-2026-016',
    test_type: 'CRP (Protéine C-réactive)',
    completed_date: '2026-02-24',
    completed_by: 'Dr. Mwamba',
    result_summary: 'CRP élevée (45 mg/L) - Inflammation'
  },
  {
    id: 'h8',
    patient_name: 'Kasongo Lydia',
    patient_id: 'P-2026-017',
    test_type: 'Électrolytes (Na, K, Cl)',
    completed_date: '2026-02-23',
    completed_by: 'Dr. Katanga',
    result_summary: 'Électrolytes équilibrés'
  },
  {
    id: 'h9',
    patient_name: 'Mwilambwe Joseph',
    patient_id: 'P-2026-018',
    test_type: 'Glycémie à jeun',
    completed_date: '2026-02-23',
    completed_by: 'Dr. Mwamba',
    result_summary: 'Hyperglycémie (7.8 mmol/L)'
  },
  {
    id: 'h10',
    patient_name: 'Ngalula Christine',
    patient_id: 'P-2026-019',
    test_type: 'NFS (Numération Formule Sanguine)',
    completed_date: '2026-02-22',
    completed_by: 'Dr. Katanga',
    result_summary: 'Anémie modérée (Hb: 10.2 g/dL)'
  }
];

export const LabHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredAnalyses = useMemo(() => {
    return mockCompletedAnalyses.filter(analysis => {
      const matchesSearch = analysis.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           analysis.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           analysis.test_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = !dateFilter || analysis.completed_date === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [searchQuery, dateFilter]);

  const handleDownloadPDF = (analysis: CompletedAnalysis) => {
    alert(`Téléchargement du PDF pour ${analysis.patient_name} - ${analysis.test_type}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Historique Analyses</h1>
        <p className="text-gray-600 mt-2">Consultez l'historique des analyses</p>
      </div>

      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-sm text-green-700 font-medium">Analyses terminées</p>
            <p className="text-2xl font-bold text-green-900">{filteredAnalyses.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom de patient, ID ou type d'examen..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {searchQuery || dateFilter ? (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <span>Résultats filtrés: {filteredAnalyses.length} analyse(s)</span>
            {(searchQuery || dateFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type d'examen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Biologiste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Résumé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAnalyses.length > 0 ? (
                filteredAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{analysis.patient_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{analysis.patient_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-900">{analysis.test_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(analysis.completed_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{analysis.completed_by}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {analysis.result_summary}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDownloadPDF(analysis)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucune analyse trouvée</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Essayez de modifier vos critères de recherche
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
