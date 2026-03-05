import { useEffect, useState } from 'react';
import { X, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  staffId?: string;
  employeeId?: string;
  onClose: () => void;
  isHRVersion?: boolean;
}

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  status: 'present' | 'late' | 'absent' | 'on_leave';
}

export default function AttendanceHistoryModal({ isOpen, staffId, employeeId, onClose, isHRVersion = false }: AttendanceHistoryModalProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const userId = isHRVersion ? employeeId : staffId;

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    }
  }, [userId, period, isOpen]);

  async function fetchHistory() {
    try {
      setLoading(true);
      const daysAgo = period === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const tableName = isHRVersion ? 'hr_attendance_records' : 'attendance_records';
      const idColumn = isHRVersion ? 'employee_id' : 'staff_id';

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idColumn, userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  function formatTime(dateString: string | null): string {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusIcon(status: string) {
    const icons = {
      present: <CheckCircle className="w-5 h-5 text-green-600" />,
      late: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      absent: <XCircle className="w-5 h-5 text-red-600" />,
      on_leave: <Calendar className="w-5 h-5 text-blue-600" />,
    };
    return icons[status as keyof typeof icons] || icons.absent;
  }

  function getStatusLabel(status: string) {
    const labels = {
      present: 'Présent',
      late: 'En retard',
      absent: 'Absent',
      on_leave: 'En congé',
    };
    return labels[status as keyof typeof labels] || 'Inconnu';
  }

  function calculateHours(checkIn: string | null, checkOut: string | null): string {
    if (!checkIn || !checkOut) return '--';

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Historique de Présence</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Period Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 derniers jours
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun enregistrement trouvé pour cette période</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {new Date(record.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-600">{getStatusLabel(record.status)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{calculateHours(record.check_in_time, record.check_out_time)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Arrivée</p>
                      <p className="font-medium text-gray-900">{formatTime(record.check_in_time)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Départ</p>
                      <p className="font-medium text-gray-900">{formatTime(record.check_out_time)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Début Pause</p>
                      <p className="font-medium text-gray-900">{formatTime(record.break_start_time)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fin Pause</p>
                      <p className="font-medium text-gray-900">{formatTime(record.break_end_time)}</p>
                    </div>
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
