import { useState, useEffect } from 'react';
import { FileText, Plus, Download, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { EnhancedAddConsultationModal } from '../../components/consultations/EnhancedAddConsultationModal';

interface Consultation {
  id: string;
  consultation_number: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  diagnosis: string;
  symptoms: string;
  treatment_plan: string;
  notes: string;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  doctor?: {
    full_name: string;
  };
}

export function ConsultationsPage() {
  const { profile } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchConsultations();
  }, []);

  async function fetchConsultations() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number),
          doctor:user_profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const headers = ['Numéro', 'Patient', 'Médecin', 'Diagnostic', 'Date'];
    const rows = filteredConsultations.map(c => [
      c.consultation_number,
      c.patient ? `${c.patient.first_name} ${c.patient.last_name}` : '',
      c.doctor?.full_name || '',
      c.diagnosis || 'N/A',
      new Date(c.created_at).toLocaleDateString('fr-FR')
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const filteredConsultations = consultations.filter(consultation => {
    const searchLower = searchTerm.toLowerCase();
    return (
      consultation.consultation_number.toLowerCase().includes(searchLower) ||
      consultation.diagnosis?.toLowerCase().includes(searchLower) ||
      (consultation.patient &&
        `${consultation.patient.first_name} ${consultation.patient.last_name}`.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
          <p className="text-gray-600">Gérer les consultations médicales</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Consultation
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par numéro, patient, diagnostic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médecin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnostic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symptômes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucune consultation trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {consultation.consultation_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {consultation.patient ? (
                        <div>
                          <div className="font-medium">
                            {consultation.patient.first_name} {consultation.patient.last_name}
                          </div>
                          <div className="text-gray-500">{consultation.patient.patient_number}</div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {consultation.doctor?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {consultation.diagnosis || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {consultation.symptoms ? consultation.symptoms.substring(0, 50) + '...' : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(consultation.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-700">Voir détails</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <EnhancedAddConsultationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchConsultations}
        />
      )}
    </div>
  );
}
