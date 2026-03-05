import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
  duration: number;
}

interface DayAvailability {
  date: string;
  availableSlots: number;
  totalSlots: number;
  status: 'high' | 'medium' | 'low' | 'none';
}

interface Props {
  doctorId: string;
  doctorName: string;
  selectedDate?: string;
  selectedTime?: string;
  onDateTimeSelect: (date: string, time: string) => void;
  disabled?: boolean;
}

export default function InteractiveAppointmentCalendar({
  doctorId,
  doctorName,
  selectedDate,
  selectedTime,
  onDateTimeSelect,
  disabled = false
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(selectedDate || null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [dayAvailability, setDayAvailability] = useState<DayAvailability[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotDuration, setSlotDuration] = useState(30);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  useEffect(() => {
    if (doctorId) {
      fetchDoctorAvailability();
      fetchSlotDuration();
    }
  }, [doctorId, currentMonth]);

  useEffect(() => {
    if (selectedDay && doctorId) {
      fetchTimeSlots(selectedDay);
    }
  }, [selectedDay, doctorId]);

  async function fetchSlotDuration() {
    try {
      const { data, error } = await supabase
        .from('doctor_schedule_templates')
        .select('slot_duration')
        .eq('doctor_id', doctorId)
        .limit(1)
        .single();

      if (!error && data) {
        setSlotDuration(data.slot_duration || 30);
      }
    } catch (err) {
      console.error('Error fetching slot duration:', err);
    }
  }

  async function fetchDoctorAvailability() {
    setLoadingCalendar(true);

    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('doctor_schedule_templates')
        .select('day_of_week, start_time, end_time, is_active')
        .eq('doctor_id', doctorId)
        .eq('is_active', true);

      if (scheduleError) throw scheduleError;

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, status')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startDate.toISOString().split('T')[0])
        .lte('appointment_date', endDate.toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed']);

      if (appointmentsError) throw appointmentsError;

      const availability: DayAvailability[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = currentDate.toISOString().split('T')[0];

        const schedule = scheduleData?.find(s => s.day_of_week === dayOfWeek);

        if (schedule && currentDate >= new Date()) {
          const totalSlots = calculateTotalSlots(schedule.start_time, schedule.end_time, slotDuration);
          const bookedSlots = appointmentsData?.filter(a => a.appointment_date === dateStr).length || 0;
          const availableSlots = Math.max(0, totalSlots - bookedSlots);

          let status: 'high' | 'medium' | 'low' | 'none' = 'none';
          if (availableSlots > totalSlots * 0.6) status = 'high';
          else if (availableSlots > totalSlots * 0.3) status = 'medium';
          else if (availableSlots > 0) status = 'low';

          availability.push({
            date: dateStr,
            availableSlots,
            totalSlots,
            status
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setDayAvailability(availability);
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoadingCalendar(false);
    }
  }

  async function fetchTimeSlots(date: string) {
    setLoadingSlots(true);

    try {
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('doctor_schedule_templates')
        .select('start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();

      if (scheduleError) {
        setTimeSlots([]);
        return;
      }

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, status')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (appointmentsError) throw appointmentsError;

      const bookedTimes = new Set(appointmentsData?.map(a => a.appointment_time) || []);
      const slots = generateTimeSlots(
        scheduleData.start_time,
        scheduleData.end_time,
        slotDuration,
        bookedTimes
      );

      setTimeSlots(slots);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function calculateTotalSlots(startTime: string, endTime: string, duration: number): number {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const diffMinutes = (end - start) / (1000 * 60);
    return Math.floor(diffMinutes / duration);
  }

  function generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    bookedTimes: Set<string>
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    let current = start;

    while (current < end) {
      const timeStr = formatTime(current);
      slots.push({
        time: timeStr,
        available: !bookedTimes.has(timeStr),
        duration
      });
      current = new Date(current.getTime() + duration * 60000);
    }

    return slots;
  }

  function parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  function formatTime(date: Date): string {
    return date.toTimeString().substring(0, 5);
  }

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDay(null);
  }

  function selectDate(dateStr: string) {
    setSelectedDay(dateStr);
  }

  function selectTimeSlot(time: string) {
    if (selectedDay) {
      onDateTimeSelect(selectedDay, time);
    }
  }

  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: JSX.Element[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isPast = dateStr < today;
      const isSelected = dateStr === selectedDay;
      const dayData = dayAvailability.find(d => d.date === dateStr);

      days.push(
        <button
          key={day}
          type="button"
          disabled={disabled || isPast || !dayData || dayData.status === 'none'}
          onClick={() => selectDate(dateStr)}
          className={`
            aspect-square p-2 rounded-lg text-sm font-medium transition-all relative
            ${isPast
              ? 'text-gray-300 cursor-not-allowed'
              : isSelected
              ? 'bg-blue-600 text-white shadow-lg'
              : dayData && dayData.status !== 'none'
              ? 'bg-white text-gray-900 hover:bg-blue-50 hover:border-blue-300 border border-gray-200'
              : 'text-gray-300 cursor-not-allowed'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div>{day}</div>
          {!isPast && dayData && dayData.status !== 'none' && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              <div
                className={`w-1 h-1 rounded-full ${
                  dayData.status === 'high'
                    ? 'bg-green-500'
                    : dayData.status === 'medium'
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
          )}
        </button>
      );
    }

    return days;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={previousMonth}
            disabled={disabled}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button
            type="button"
            onClick={nextMonth}
            disabled={disabled}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {loadingCalendar ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Nombreux créneaux</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>Quelques créneaux</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Presque complet</span>
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Créneaux disponibles - {new Date(selectedDay + 'T00:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </h3>
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Aucun créneau disponible pour cette date</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = slot.time === selectedTime && selectedDay === selectedDay;

                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={disabled || !slot.available}
                    onClick={() => selectTimeSlot(slot.time)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all border-2
                      ${isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : slot.available
                        ? 'bg-white text-gray-900 border-green-300 hover:border-green-500 hover:bg-green-50'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {slot.available ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>{slot.time}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedDay && (
        <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
          <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-700">
            Sélectionnez d'abord une date dans le calendrier pour voir les créneaux horaires disponibles
          </p>
        </div>
      )}
    </div>
  );
}
