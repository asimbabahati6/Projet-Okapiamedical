import { useState } from 'react';
import { X, Search, Calendar, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppointmentLookupProps {
  onClose: () => void;
}

interface LookupResult {
  id: string;
  ticket_number: string;
  patient_name: string;
  doctor_name: string;
  queue_position: number;
  patient_status: string;
  created_at: string;
}

export function AppointmentLookup({ onClose }: AppointmentLookupProps) {
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<LookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const { data } = await supabase
        .from('booking_queue')
        .select('*')
        .eq('patient_phone', phone.trim())
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setResults(data.map((r: any) => ({
          id: r.id,
          ticket_number: r.ticket_number,
          patient_name: r.patient_name,
          doctor_name: r.doctor_name,
          queue_position: r.queue_position,
          patient_status: r.patient_status,
          created_at: r.created_at,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'En attente de paiement';
      case 'paid': return 'Paye - en attente';
      case 'called': return 'Appele';
      default: return status;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Rechercher un rendez-vous</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numero de telephone..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Chercher'}
            </button>
          </form>

          {searched && results.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-4">Aucun rendez-vous trouve</p>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{r.ticket_number}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {getStatusLabel(r.patient_status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> {r.doctor_name}</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
