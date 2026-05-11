import { Send, Clock, CheckCircle2 } from 'lucide-react';

interface ReportStatusBadgeProps {
  totalExams: number;
  reportsSent: number;
}

export function ReportStatusBadge({ totalExams, reportsSent }: ReportStatusBadgeProps) {
  if (totalExams === 0) return null;

  const allSent = reportsSent === totalExams;
  const percentage = Math.round((reportsSent / totalExams) * 100);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
      allSent
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-gray-50 text-gray-600 border-gray-200'
    }`}>
      {allSent ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : reportsSent > 0 ? (
        <Send className="w-3.5 h-3.5" />
      ) : (
        <Clock className="w-3.5 h-3.5" />
      )}
      <span>{reportsSent}/{totalExams} rapports envoyés</span>
      {!allSent && (
        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
