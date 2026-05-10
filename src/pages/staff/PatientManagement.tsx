import { useState, useEffect } from 'react';
import { Search, Plus, User, CreditCard as Edit, FileText, Download, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Patient } from '../../types/database';
import { AddPatientModal } from '../../components/patients/AddPatientModal';
import { PatientDetailsModal } from '../../components/patients/PatientDetailsModal';
import { EditPatientModal } from '../../components/patients/EditPatientModal';
import { generatePatientPDF } from '../../utils/patientPDFExport';
import { generatePatientExcel } from '../../utils/patientExcelExport';
import { useToast } from '../../hooks/useToast';

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [exportingPatientId, setExportingPatientId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function exportToCSV() {
    const headers = ['Numéro Patient', 'Prénom', 'Nom', 'Date de Naissance', 'Âge', 'Sexe', 'Téléphone', 'Email', 'Groupe Sanguin', 'Ville'];
    const rows = filteredPatients.map(p => [
      p.patient_number,
      p.first_name,
      p.last_name,
      p.date_of_birth,
      calculateAge(p.date_of_birth),
      p.gender,
      p.phone || '',
      p.email || '',
      p.blood_group || '',
      p.city || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  async function handleExportPDF(patient: Patient) {
    setExportingPatientId(patient.id);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          primary_care_physician:medical_staff!primary_care_physician_id(
            id,
            license_number,
            specialization,
            consultation_fee,
            user_profile:user_profiles(full_name, phone)
          )
        `)
        .eq('id', patient.id)
        .single();

      if (patientError) throw patientError;

      const { data: insIdentity } = await supabase
        .from('patient_ins_identity')
        .select('*')
        .eq('patient_id', patient.id)
        .maybeSingle();

      const { data: medicalHistory } = await supabase
        .from('patient_medical_history')
        .select('*')
        .eq('patient_id', patient.id)
        .order('diagnosis_date', { ascending: false });

      const { data: allergies } = await supabase
        .from('patient_allergies_detailed')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      const { data: consultations } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:medical_staff!doctor_id(
            id,
            specialization,
            user_profile:user_profiles(full_name)
          )
        `)
        .eq('patient_id', patient.id)
        .order('consultation_date', { ascending: false })
        .limit(10);

      const fileName = generatePatientPDF({
        patient: patientData,
        insIdentity,
        medicalHistory: medicalHistory || [],
        allergies: allergies || [],
        consultations: consultations || [],
      });

      await supabase.from('patient_data_access_log').insert({
        patient_id: patient.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        access_type: 'export',
        accessed_sections: ['pdf_export'],
        access_reason: 'PDF Export from Patient Management',
      });

      showToast(`PDF généré avec succès: ${fileName}`, 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Erreur lors de l\'export PDF', 'error');
    } finally {
      setExportingPatientId(null);
    }
  }

  async function handleExportExcel(patient: Patient) {
    setExportingPatientId(patient.id);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          primary_care_physician:medical_staff!primary_care_physician_id(
            id,
            license_number,
            specialization,
            consultation_fee,
            user_profile:user_profiles(full_name, phone)
          )
        `)
        .eq('id', patient.id)
        .single();

      if (patientError) throw patientError;

      const { data: insIdentity } = await supabase
        .from('patient_ins_identity')
        .select('*')
        .eq('patient_id', patient.id)
        .maybeSingle();

      const { data: medicalHistory } = await supabase
        .from('patient_medical_history')
        .select('*')
        .eq('patient_id', patient.id)
        .order('diagnosis_date', { ascending: false });

      const { data: allergies } = await supabase
        .from('patient_allergies_detailed')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      const { data: consultations } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:medical_staff!doctor_id(
            id,
            specialization,
            user_profile:user_profiles(full_name)
          )
        `)
        .eq('patient_id', patient.id)
        .order('consultation_date', { ascending: false })
        .limit(10);

      const fileName = generatePatientExcel({
        patient: patientData,
        insIdentity,
        medicalHistory: medicalHistory || [],
        allergies: allergies || [],
        consultations: consultations || [],
      });

      await supabase.from('patient_data_access_log').insert({
        patient_id: patient.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        access_type: 'export',
        accessed_sections: ['excel_export'],
        access_reason: 'Excel Export from Patient Management',
      });

      showToast(`Fichier Excel généré avec succès: ${fileName}`, 'success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showToast('Erreur lors de l\'export Excel', 'error');
    } finally {
      setExportingPatientId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Patients</h1>
          <p className="text-gray-600">Gérer les dossiers et informations des patients</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Ajouter un Patient
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, numéro de patient ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Âge/Sexe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groupe Sanguin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucun patient trouvé
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{patient.patient_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {calculateAge(patient.date_of_birth)} ans ({patient.gender.charAt(0).toUpperCase()})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">{patient.phone || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{patient.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {patient.blood_group || 'Inconnu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir Détails"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(patient)}
                          disabled={exportingPatientId === patient.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Exporter PDF"
                        >
                          {exportingPatientId === patient.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleExportExcel(patient)}
                          disabled={exportingPatientId === patient.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Exporter Excel"
                        >
                          {exportingPatientId === patient.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <FileSpreadsheet className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPatients.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Affichage de {filteredPatients.length} sur {patients.length} patients
        </div>
      )}

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchPatients}
        />
      )}

      {showDetailsModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPatient(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {showEditModal && selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={fetchPatients}
        />
      )}
    </div>
  );
}
