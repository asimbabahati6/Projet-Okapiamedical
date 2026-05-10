import { useState, useEffect } from 'react';
import { X, User, Calendar, Activity, FileText, Search, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { DoctorWorkload } from '../../services/doctorAnalyticsService';

interface DoctorPatientsOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorWorkload;
}

interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  social_security_number: string;
  phone: string;
  last_visit: string | null;
  next_appointment: string | null;
  active_prescriptions: number;
  pending_lab_results: number;
  consultation_count: number;
  critical_notes: string | null;
}

export default function DoctorPatientsOverviewModal({ isOpen, onClose, doctor }: DoctorPatientsOverviewModalProps) {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'last_visit' | 'next_appointment'>('name');
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<Record<string, any>>({});
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen, doctor.doctorId]);

  async function fetchPatients() {
    setLoading(true);
    try {
      const { data: patientsData, error } = await supabase
        .from('patients')
        .select('*')
        .eq('primary_care_physician_id', doctor.doctorId);

      if (error) throw error;

      const enrichedPatients = await Promise.all(
        (patientsData || []).map(async (patient) => {
          const { data: lastVisit } = await supabase
            .from('consultations')
            .select('consultation_date')
            .eq('patient_id', patient.id)
            .order('consultation_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: nextAppt } = await supabase
            .from('appointments')
            .select('appointment_date')
            .eq('patient_id', patient.id)
            .gte('appointment_date', new Date().toISOString())
            .order('appointment_date')
            .limit(1)
            .maybeSingle();

          const { count: prescCount } = await supabase
            .from('prescriptions')
            .select('id', { count: 'exact', head: true })
            .eq('patient_id', patient.id)
            .eq('status', 'active');

          const { count: labCount } = await supabase
            .from('lab_orders')
            .select('id', { count: 'exact', head: true })
            .eq('patient_id', patient.id)
            .eq('status', 'pending');

          const { count: consultCount } = await supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('patient_id', patient.id);

          return {
            id: patient.id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            date_of_birth: patient.date_of_birth,
            social_security_number: patient.social_security_number,
            phone: patient.phone,
            last_visit: lastVisit?.consultation_date || null,
            next_appointment: nextAppt?.appointment_date || null,
            active_prescriptions: prescCount || 0,
            pending_lab_results: labCount || 0,
            consultation_count: consultCount || 0,
            critical_notes: patient.medical_notes || null
          };
        })
      );

      setPatients(enrichedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showToast('Erreur lors du chargement des patients', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPatientDetails(patientId: string) {
    if (patientDetails[patientId]) {
      return;
    }

    try {
      const [consultations, prescriptions, labOrders] = await Promise.all([
        supabase
          .from('consultations')
          .select('*')
          .eq('patient_id', patientId)
          .order('consultation_date', { ascending: false })
          .limit(5),
        supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('lab_orders')
          .select('*')
          .eq('patient_id', patientId)
          .order('order_date', { ascending: false })
          .limit(5)
      ]);

      setPatientDetails(prev => ({
        ...prev,
        [patientId]: {
          consultations: consultations.data || [],
          prescriptions: prescriptions.data || [],
          labOrders: labOrders.data || []
        }
      }));
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  }

  function togglePatientDetails(patientId: string) {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patientId);
      fetchPatientDetails(patientId);
    }
  }

  const filteredPatients = patients
    .filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.social_security_number.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
      } else if (sortBy === 'last_visit') {
        if (!a.last_visit) return 1;
        if (!b.last_visit) return -1;
        return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
      } else {
        if (!a.next_appointment) return 1;
        if (!b.next_appointment) return -1;
        return new Date(a.next_appointment).getTime() - new Date(b.next_appointment).getTime();
      }
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patients de {doctor.doctorName}</h2>
            <p className="text-sm text-gray-600 mt-1">{patients.length} patients assignés</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou NSS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Trier par nom</option>
              <option value="last_visit">Dernière visite</option>
              <option value="next_appointment">Prochain RDV</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement des patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient assigné'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map(patient => {
                const isExpanded = expandedPatient === patient.id;
                const details = patientDetails[patient.id];

                return (
                  <div key={patient.id} className="border rounded-lg">
                    <button
                      onClick={() => togglePatientDetails(patient.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(patient.first_name + patient.last_name)}`}
                          alt={`${patient.first_name} ${patient.last_name}`}
                          className="w-12 h-12 rounded-full ring-2 ring-gray-200"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            NSS: {patient.social_security_number} • Âge: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} ans
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center text-sm">
                          <div>
                            <div className="text-gray-500">Consultations</div>
                            <div className="font-semibold text-gray-900">{patient.consultation_count}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Ordonnances</div>
                            <div className="font-semibold text-blue-600">{patient.active_prescriptions}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Analyses</div>
                            <div className="font-semibold text-orange-600">{patient.pending_lab_results}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Dernière visite</div>
                            <div className="font-semibold text-gray-900">
                              {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('fr-FR') : 'Jamais'}
                            </div>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t bg-gray-50">
                        {details ? (
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-600" />
                                Consultations récentes
                              </h4>
                              {details.consultations.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                  {details.consultations.map((c: any) => (
                                    <li key={c.id} className="border-l-2 border-blue-200 pl-2">
                                      <div className="font-medium">{new Date(c.consultation_date).toLocaleDateString('fr-FR')}</div>
                                      <div className="text-gray-600">{c.diagnosis || 'Diagnostic non renseigné'}</div>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">Aucune consultation</p>
                              )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-green-600" />
                                Ordonnances actives
                              </h4>
                              {details.prescriptions.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                  {details.prescriptions.slice(0, 3).map((p: any) => (
                                    <li key={p.id} className="border-l-2 border-green-200 pl-2">
                                      <div className="font-medium">{new Date(p.created_at).toLocaleDateString('fr-FR')}</div>
                                      <div className="text-gray-600">{p.medications?.length || 0} médicament(s)</div>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">Aucune ordonnance</p>
                              )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-600" />
                                Examens de laboratoire
                              </h4>
                              {details.labOrders.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                  {details.labOrders.slice(0, 3).map((l: any) => (
                                    <li key={l.id} className="border-l-2 border-orange-200 pl-2">
                                      <div className="font-medium">{new Date(l.order_date).toLocaleDateString('fr-FR')}</div>
                                      <div className="text-gray-600">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                          l.status === 'completed' ? 'bg-green-100 text-green-700' :
                                          l.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {l.status}
                                        </span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">Aucun examen</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          </div>
                        )}

                        {patient.critical_notes && (
                          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">
                              <strong>Note importante :</strong> {patient.critical_notes}
                            </p>
                          </div>
                        )}

                        {patient.next_appointment && (
                          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Prochain rendez-vous :</strong> {new Date(patient.next_appointment).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
