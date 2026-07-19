import { useSearchParams } from 'react-router-dom';
import { FeedbackForm } from '../../components/feedback/FeedbackForm';

export function FeedbackPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const patientName = params.get('name') || undefined;
  const appointmentId = params.get('appt') || undefined;

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="card p-10 max-w-md w-full text-center">
          <p className="text-ink-muted">Lien de feedback invalide ou expiré.</p>
        </div>
      </div>
    );
  }

  return (
    <FeedbackForm
      token={token}
      patientName={patientName}
      appointmentId={appointmentId}
    />
  );
}
