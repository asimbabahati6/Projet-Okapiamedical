import { useState, useMemo, memo } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Calendar, User, Stethoscope, Clock } from 'lucide-react';
import { ConsultationWithDetails, SortField, SortDirection } from '../../../types/consultationHistory';
import { formatDoctorName } from '../../../utils/formatDoctorName';

interface ConsultationTableProps {
  consultations: ConsultationWithDetails[];
  onConsultationClick: (consultation: ConsultationWithDetails) => void;
  loading?: boolean;
}

export const ConsultationTable = memo(function ConsultationTable({
  consultations,
  onConsultationClick,
  loading = false
}: ConsultationTableProps) {
  const [sortField, setSortField] = useState<SortField>('consultation_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedConsultations = useMemo(() => {
    return [...consultations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'consultation_date':
          aValue = new Date(a.consultation_date).getTime();
          bValue = new Date(b.consultation_date).getTime();
          break;
        case 'patient_name':
          aValue = `${a.patient?.first_name} ${a.patient?.last_name}`;
          bValue = `${b.patient?.first_name} ${b.patient?.last_name}`;
          break;
        case 'doctor_name':
          aValue = a.doctor?.user_profile?.full_name || '';
          bValue = b.doctor?.user_profile?.full_name || '';
          break;
        case 'diagnosis':
          aValue = a.diagnosis || '';
          bValue = b.diagnosis || '';
          break;
        case 'follow_up_date':
          aValue = a.follow_up_date ? new Date(a.follow_up_date).getTime() : 0;
          bValue = b.follow_up_date ? new Date(b.follow_up_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [consultations, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const isFollowUpOverdue = (followUpDate: string | null) => {
    if (!followUpDate) return false;
    return new Date(followUpDate) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Aucune consultation trouvée</p>
          <p className="text-gray-400 text-sm">Essayez d'ajuster vos filtres de recherche</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                onClick={() => handleSort('consultation_date')}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Date
                  <SortIcon field="consultation_date" />
                </div>
              </th>
              <th
                onClick={() => handleSort('patient_name')}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Patient
                  <SortIcon field="patient_name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('doctor_name')}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Médecin
                  <SortIcon field="doctor_name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('diagnosis')}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Diagnostic
                  <SortIcon field="diagnosis" />
                </div>
              </th>
              <th
                onClick={() => handleSort('follow_up_date')}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Suivi
                  <SortIcon field="follow_up_date" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedConsultations.map((consultation) => (
              <tr
                key={consultation.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onConsultationClick(consultation)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(consultation.consultation_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(consultation.consultation_date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {consultation.patient?.first_name} {consultation.patient?.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {consultation.patient?.patient_number}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDoctorName(consultation.doctor?.user_profile?.full_name)}
                      </div>
                      {consultation.doctor?.specialization && (
                        <div className="text-xs text-blue-600">
                          {consultation.doctor.specialization}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {consultation.diagnosis || (
                        <span className="text-gray-400 italic">Non spécifié</span>
                      )}
                    </div>
                    {consultation.chief_complaint && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {consultation.chief_complaint}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {consultation.follow_up_date ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            isFollowUpOverdue(consultation.follow_up_date)
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {new Date(consultation.follow_up_date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </div>
                        {isFollowUpOverdue(consultation.follow_up_date) && (
                          <div className="text-xs text-red-500">En retard</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConsultationClick(consultation);
                    }}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Détails
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.consultations === nextProps.consultations &&
    prevProps.loading === nextProps.loading
  );
});
