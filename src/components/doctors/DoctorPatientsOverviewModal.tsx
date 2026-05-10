import { useState, useEffect } from 'react';
import { X, Users, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DoctorPatientsOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: { id: string; full_name?: string; specialization?: string } | null;
}

interface PatientEntry {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
  last_visit: string | null;
}

export default function DoctorPatientsOverviewModal({ isOpen, onClose, doctor }: DoctorPatientsOverviewModalProps) {
  const [patients, setPatients] = useState<PatientEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && doctor) fetchPatients();
  }, [isOpen, doctor]);

  async function fetchPatients() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, patient_number')
        .eq('primary_care_physician_id', doctor?.id)
        .order('last_name')
        .limit(50);

      if (data) {
        setPatients(data.map((p: any) => ({
          ...p,
          last_visit: null,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Patients du Dr. {doctor.full_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{doctor.specialization || 'Generaliste'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Chargement...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aucun patient assigne</p>
            </div>
          ) : (
            <div className="space-y-2">
              {patients.map((patient) => (
                <div key={patient.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {patient.last_name} {patient.first_name}
                    </p>
                    <p className="text-xs text-gray-500">{patient.patient_number}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
