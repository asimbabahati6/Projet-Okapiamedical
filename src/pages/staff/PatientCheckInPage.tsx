import { useState, useEffect } from 'react';
import { UserCheck, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CheckInEntry {
  id: string;
  patient_name: string;
  patient_phone: string;
  check_in_time: string;
  status: string;
  department: string;
}

export function PatientCheckInPage() {
  const [entries, setEntries] = useState<CheckInEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCheckIns();
  }, []);

  async function fetchCheckIns() {
    try {
      const { data } = await supabase
        .from('booking_queue')
        .select('id, patient_name, patient_phone, created_at, patient_status, specialty')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setEntries(data.map((e: Record<string, unknown>) => ({
          id: e.id as string,
          patient_name: e.patient_name as string,
          patient_phone: (e.patient_phone as string) || '',
          check_in_time: e.created_at as string,
          status: (e.patient_status as string) || 'pending',
          department: (e.specialty as string) || 'Général',
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = entries.filter(e =>
    e.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusInfo = (status: string) => {
    switch (status) {
      case 'called': return { icon: <CheckCircle className="w-4 h-4 text-green-500" />, label: 'Appelé', color: 'bg-green-100 text-green-800' };
      case 'paid': return { icon: <Clock className="w-4 h-4 text-blue-500" />, label: 'En attente', color: 'bg-blue-100 text-blue-800' };
      default: return { icon: <AlertCircle className="w-4 h-4 text-yellow-500" />, label: 'En attente paiement', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UserCheck className="w-7 h-7 text-blue-600" />
            Accueil Patients
          </h1>
          <p className="text-gray-500 mt-1">Enregistrement et file d'attente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {entries.filter(e => e.status === 'paid').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Appelés</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {entries.filter(e => e.status === 'called').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total aujourd'hui</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{entries.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
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
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun patient enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((entry) => {
              const info = statusInfo(entry.status);
              return (
                <div key={entry.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                  {info.icon}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{entry.patient_name}</p>
                    <p className="text-sm text-gray-500">{entry.department}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${info.color}`}>
                    {info.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
