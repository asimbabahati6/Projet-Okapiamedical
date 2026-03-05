import { useState } from 'react';
import { Star, Clock, Users, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  token: string;
  patientName?: string;
  appointmentId?: string;
  onSuccess?: () => void;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function FeedbackForm({ token, patientName, appointmentId, onSuccess }: Props) {
  const [overall, setOverall] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [reception, setReception] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!overall || !waitTime || !reception) {
      setError('Veuillez renseigner toutes les notes.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from('patient_feedbacks').insert({
        appointment_id: appointmentId || null,
        patient_name: patientName || 'Anonyme',
        feedback_token: token,
        overall_rating: overall,
        wait_time_rating: waitTime,
        reception_rating: reception,
        comment,
      });
      if (err) throw err;
      setSubmitted(true);
      onSuccess?.();
    } catch (err: unknown) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Merci pour votre retour !</h2>
          <p className="text-gray-600">Votre avis nous aide à améliorer continuellement la qualité de nos services.</p>
          <p className="text-sm text-gray-400 mt-4">Direction — Prof BAZEBOSO J.A. · OKAPIA MEDICAL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 text-center">
          <h1 className="text-white font-bold text-xl">OKAPIA MEDICAL</h1>
          <p className="text-blue-100 text-sm mt-1">Votre satisfaction, notre priorité</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {patientName && (
            <p className="text-gray-800 font-medium">Bonjour <span className="text-blue-600">{patientName}</span>,</p>
          )}
          <p className="text-sm text-gray-600">
            Merci pour votre visite. Prenez 2 minutes pour évaluer votre expérience.
          </p>

          <StarRating value={overall} onChange={setOverall} label="Note globale" />

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-yellow-500" />
            <StarRating value={waitTime} onChange={setWaitTime} label="Temps d'attente" />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-blue-500" />
            <StarRating value={reception} onChange={setReception} label="Qualité de l'accueil" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Partagez votre expérience..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Soumettre mon avis
          </button>
        </form>

        <div className="border-t border-gray-100 px-6 py-3 text-center text-xs text-gray-400">
          www.okapiamedical.com
        </div>
      </div>
    </div>
  );
}
