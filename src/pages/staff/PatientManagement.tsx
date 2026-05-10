import { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
  city: string | null;
  created_at: string;
}

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, phone, gender, date_of_birth, city, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        setPatients(data as Patient[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            Gestion des Patients
          </h1>
          <p className="text-gray-500 mt-1">Registre et dossiers des patients</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
          <Plus className="w-4 h-4" />
          Nouveau patient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total patients</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{patients.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Hommes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{patients.filter(p => p.gender === 'M').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Femmes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{patients.filter(p => p.gender === 'F').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun patient trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((patient) => (
              <div key={patient.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-semibold text-sm">
                    {patient.full_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{patient.full_name}</p>
                  <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500">
                    {patient.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patient.phone}</span>
                    )}
                    {patient.city && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{patient.city}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(patient.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
