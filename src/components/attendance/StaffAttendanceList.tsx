import { CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';

interface StaffAttendance {
  staff: {
    id: string;
    full_name: string;
    email: string;
    role: { name: string };
  };
  today_status: 'present' | 'late' | 'absent' | 'on_leave' | null;
  this_week_present: number;
  this_month_present: number;
  total_hours_month: number;
}

interface StaffAttendanceListProps {
  staffAttendance: StaffAttendance[];
}

export default function StaffAttendanceList({ staffAttendance }: StaffAttendanceListProps) {
  function getStatusBadge(status: string | null) {
    const badges = {
      present: { bg: 'bg-green-100', text: 'text-green-800', label: 'Présent', icon: CheckCircle },
      late: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Retard', icon: AlertCircle },
      absent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Absent', icon: XCircle },
      on_leave: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Congé', icon: Calendar },
    };

    const badge = status ? badges[status as keyof typeof badges] : badges.absent;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employé
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut Aujourd'hui
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cette Semaine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ce Mois
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Heures Totales
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffAttendance.map((sa) => (
              <tr key={sa.staff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{sa.staff.full_name}</div>
                    <div className="text-sm text-gray-500">{sa.staff.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(sa.today_status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sa.this_week_present} jours
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sa.this_month_present} jours
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sa.total_hours_month}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
