import { useState, useEffect } from 'react';
import { FileText, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PatientWithDocuments, PatientDocumentAssignment } from '../../types/medicalDocuments';
import { useToast } from '../../hooks/useToast';
import { getDocumentTypeConfig, DOCUMENT_TYPE_LIST } from '../../config/documentTypes';

interface PatientDocumentListProps {
  onSelectPatient: (patient: PatientWithDocuments, documentType: string) => void;
  selectedDocumentType?: string;
}

export function PatientDocumentList({ onSelectPatient, selectedDocumentType }: PatientDocumentListProps) {
  const { success, error } = useToast();
  const [patients, setPatients] = useState<PatientWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocType, setFilterDocType] = useState<string>(selectedDocumentType || '');

  useEffect(() => {
    fetchPatientsWithDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocumentType) {
      setFilterDocType(selectedDocumentType);
    }
  }, [selectedDocumentType]);

  async function fetchPatientsWithDocuments() {
    try {
      setLoading(true);

      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      if (!patientsData || patientsData.length === 0) {
        setPatients([]);
        return;
      }

      const { data: assignments, error: assignmentsError } = await supabase
        .from('patient_document_assignments')
        .select(`
          *,
          template:medical_document_templates (
            id,
            document_type,
            template_name,
            template_name_en,
            icon,
            color
          )
        `)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      const patientsWithDocs: PatientWithDocuments[] = patientsData.map(patient => {
        const patientAssignments = assignments?.filter(a => a.patient_id === patient.id) || [];
        const docTypes = patientAssignments
          .map(a => a.template?.document_type)
          .filter((type): type is string => !!type);

        return {
          ...patient,
          document_count: patientAssignments.length,
          document_types: docTypes,
          assigned_documents: patientAssignments as PatientDocumentAssignment[],
        };
      });

      setPatients(patientsWithDocs);
    } catch (err) {
      console.error('Error fetching patients:', err);
      error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchTerm ||
      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDocType = !filterDocType ||
      (patient.document_types && patient.document_types.includes(filterDocType));

    return matchesSearch && matchesDocType;
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, prénom ou numéro patient..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les types de documents</option>
              {DOCUMENT_TYPE_LIST.map(docType => (
                <option key={docType.type} value={docType.type}>
                  {docType.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} trouvé{filteredPatients.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucun patient trouvé</p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <div
              key={patient.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {patient.patient_number}
                        </span>
                        <span>•</span>
                        <span>{calculateAge(patient.date_of_birth)} ans</span>
                        <span>•</span>
                        <span>{patient.gender === 'male' ? 'Homme' : 'Femme'}</span>
                        {patient.blood_group && (
                          <>
                            <span>•</span>
                            <span>Groupe: {patient.blood_group}</span>
                          </>
                        )}
                      </div>
                      {patient.city && (
                        <p className="text-sm text-gray-500 mt-1">{patient.city}</p>
                      )}
                    </div>
                  </div>

                  {patient.assigned_documents && patient.assigned_documents.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {patient.assigned_documents.map((assignment) => {
                        const config = getDocumentTypeConfig(assignment.template?.document_type || '');
                        const Icon = config ? config.icon : FileText;

                        return (
                          <button
                            key={assignment.id}
                            onClick={() => onSelectPatient(patient, assignment.template?.document_type || '')}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all ${config?.bgColor} ${config?.borderColor} ${config?.hoverColor}`}
                            style={{ borderColor: config?.color }}
                          >
                            <Icon className="w-4 h-4" style={{ color: config?.color }} />
                            <span className="text-sm font-medium" style={{ color: config?.color }}>
                              {assignment.template?.template_name || 'Document'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-center px-3 py-2 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{patient.document_count || 0}</div>
                    <div className="text-xs text-gray-600">Type{(patient.document_count || 0) > 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
