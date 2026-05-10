import { useState, useEffect } from 'react';
import { FileText, Search, Plus, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface DoctorConsultation {
  id: string;
  consultation_number: string;
  patient_name: string;
  diagnosis: string | null;
  consultation_date: string;
  status: string;
}

export function ConsultationsPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<DoctorConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConsultations();
  }, []);

  async function fetchConsultations() {
    try {
      const { data } = await supabase
        .from('consultations')
        .select(`
          id, consultation_number, diagnosis, consultation_date, status,
          patient:patients(first_name, last_name)
        `)
        .eq('doctor_id', user?.id)
        .order('consultation_date', { ascending: false })
        .limit(50);

      if (data) {
        setConsultations(data.map((c: any) => ({
          id: c.id,
          consultation_number: c.consultation_number || '-',
          patient_name: c.patient ? `${c.patient.last_name} ${c.patient.first_name}` : 'Inconnu',
          diagnosis: c.diagnosis,
          consultation_date: c.consultation_date,
          status: c.status || 'completed',
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = consultations.filter(c =>
    search === '' ||
    c.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.diagnosis && c.diagnosis.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Mes Consultations
        </h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>Aucune consultation trouvee</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{c.patient_name}</p>
                    <p className="text-sm text-gray-500">{c.diagnosis || 'Diagnostic non renseigne'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(c.consultation_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
