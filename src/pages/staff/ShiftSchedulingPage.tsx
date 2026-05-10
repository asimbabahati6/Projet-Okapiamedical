import { useEffect, useState } from 'react';
import { Calendar, Users, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ShiftSchedule, Employee, ShiftType } from '../../types/drcClinic';

export function ShiftSchedulingPage() {
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    try {
      const { data: shiftsData } = await supabase
        .from('shift_schedules')
        .select(`
          *,
          employee:employees(*),
          shift_type:shift_types(*)
        `)
        .eq('shift_date', selectedDate)
        .order('start_time', { ascending: true });

      setShifts(shiftsData || []);

      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')
        .eq('is_medical_staff', true);

      setEmployees(empData || []);

      const { data: typesData } = await supabase
        .from('shift_types')
        .select('*')
        .order('start_time', { ascending: true });

      setShiftTypes(typesData || []);
    } catch (error) {
      console.error('Error loading shift data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getShiftStatusBadge(status: string) {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    };
    const labels = {
      scheduled: 'Planifié',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
      no_show: 'Absent'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const onDutyStaff = shifts.filter(s => s.status === 'confirmed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Horaires</h1>
          <p className="text-gray-600 mt-1">Planification des gardes médicales 24/7</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Personnel de Garde</p>
              <p className="text-2xl font-bold text-blue-600">{onDutyStaff.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Personnel Médical</p>
              <p className="text-2xl font-bold text-green-600">{employees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Types de Garde</p>
              <p className="text-2xl font-bold text-purple-600">{shiftTypes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Alertes</p>
              <p className="text-2xl font-bold text-orange-600">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Horaires du Jour</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {shifts.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune garde planifiée pour cette date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift) => (
              <div key={shift.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                {shift.employee?.photo_url ? (
                  <img
                    src={shift.employee.photo_url}
                    alt={`${shift.employee.first_name} ${shift.employee.last_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {shift.employee?.first_name?.[0]}{shift.employee?.last_name?.[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {shift.employee?.first_name} {shift.employee?.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{shift.employee?.position}</p>
                </div>
                <div
                  className="px-3 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: shift.shift_type?.color_code || '#3b82f6' }}
                >
                  {shift.shift_type?.name}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(shift.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {getShiftStatusBadge(shift.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Types de Garde Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shiftTypes.map((type) => (
            <div
              key={type.id}
              className="p-4 rounded-lg border-2"
              style={{ borderColor: type.color_code || '#3b82f6' }}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
              <p className="text-sm text-gray-600">
                {type.start_time} - {type.end_time}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Durée: {type.duration_hours}h
              </p>
              <p className="text-xs text-gray-500">
                Repos minimum: {type.min_rest_hours}h
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
