import { Users, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface StaffAttendance {
  today_status: 'present' | 'late' | 'absent' | 'on_leave' | null;
  total_hours_month: number;
}

interface AttendanceStatsCardsProps {
  staffAttendance: StaffAttendance[];
}

export default function AttendanceStatsCards({ staffAttendance }: AttendanceStatsCardsProps) {
  const stats = {
    total: staffAttendance.length,
    present: staffAttendance.filter(s => s.today_status === 'present').length,
    late: staffAttendance.filter(s => s.today_status === 'late').length,
    absent: staffAttendance.filter(s => s.today_status === 'absent' || s.today_status === null).length,
    onLeave: staffAttendance.filter(s => s.today_status === 'on_leave').length,
    avgHours: staffAttendance.length > 0
      ? (staffAttendance.reduce((sum, s) => sum + s.total_hours_month, 0) / staffAttendance.length).toFixed(1)
      : '0',
  };

  const cards = [
    { title: 'Total Personnel', value: stats.total, icon: Users, color: 'bg-blue-500' },
    { title: 'Présents', value: stats.present, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'En Retard', value: stats.late, icon: AlertCircle, color: 'bg-yellow-500' },
    { title: 'Absents', value: stats.absent, icon: XCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
