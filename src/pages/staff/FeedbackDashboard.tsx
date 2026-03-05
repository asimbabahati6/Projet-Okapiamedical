import { useState, useEffect } from 'react';
import { Star, MessageSquare, Award, ThumbsUp, ThumbsDown, BarChart2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Feedback {
  id: string;
  patient_name: string;
  overall_rating: number;
  wait_time_rating: number;
  reception_rating: number;
  comment: string;
  submitted_at: string;
}

interface WeeklyVolume {
  week: string;
  count: number;
}

const ALLOWED_ROLES = ['super_admin', 'hospital_admin', 'medecin_chef_staff', 'medical_director', 'admin', 'directeur_general'];

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </span>
  );
}

function KPICard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: WeeklyVolume[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-24 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{d.count}</span>
          <div
            className="w-full bg-blue-500 rounded-t transition-all"
            style={{ height: `${(d.count / max) * 64}px`, minHeight: d.count > 0 ? 4 : 0 }}
          />
          <span className="text-xs text-gray-400 truncate w-full text-center">{d.week}</span>
        </div>
      ))}
    </div>
  );
}

export function FeedbackDashboard() {
  const { profile } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const userRole = (profile?.role as { name?: string } | null)?.name || '';
  const hasAccess = ALLOWED_ROLES.includes(userRole);

  useEffect(() => {
    if (hasAccess) fetchFeedbacks();
  }, [hasAccess]);

  async function fetchFeedbacks() {
    setLoading(true);
    const { data } = await supabase
      .from('patient_feedbacks')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(200);
    setFeedbacks(data || []);
    setLoading(false);
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Award className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Accès réservé à la Direction.</p>
        </div>
      </div>
    );
  }

  const avgOverall = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.overall_rating, 0) / feedbacks.length).toFixed(1)
    : '—';
  const avgWait = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.wait_time_rating, 0) / feedbacks.length).toFixed(1)
    : '—';
  const avgReception = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.reception_rating, 0) / feedbacks.length).toFixed(1)
    : '—';

  const positive = feedbacks.filter(f => f.overall_rating >= 4);
  const negative = feedbacks.filter(f => f.overall_rating <= 2);

  const weeklyMap: Record<string, number> = {};
  feedbacks.forEach(f => {
    const d = new Date(f.submitted_at);
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - d.getDay());
    const key = sunday.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    weeklyMap[key] = (weeklyMap[key] || 0) + 1;
  });
  const weeklyData: WeeklyVolume[] = Object.entries(weeklyMap)
    .slice(-8)
    .map(([week, count]) => ({ week, count }));

  const displayed = feedbacks.filter(f => {
    if (filter === 'positive') return f.overall_rating >= 4;
    if (filter === 'negative') return f.overall_rating <= 2;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Satisfaction</h1>
        <p className="text-gray-500 mt-1">Vue Super-Utilisateur — Prof BAZEBOSO J.A.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Star} label="Note moyenne globale" value={avgOverall} color="bg-yellow-500" sub="/5 étoiles" />
        <KPICard icon={MessageSquare} label="Total feedbacks" value={feedbacks.length} color="bg-blue-500" />
        <KPICard icon={ThumbsUp} label="Avis positifs (≥4)" value={positive.length} color="bg-green-500" sub={`${feedbacks.length ? Math.round((positive.length / feedbacks.length) * 100) : 0}%`} />
        <KPICard icon={ThumbsDown} label="Avis négatifs (≤2)" value={negative.length} color="bg-red-500" sub={`${feedbacks.length ? Math.round((negative.length / feedbacks.length) * 100) : 0}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Volume de feedbacks par semaine</h2>
          </div>
          <p className="text-xs text-gray-400 mb-2">8 dernières semaines</p>
          {weeklyData.length > 0 ? (
            <MiniBarChart data={weeklyData} />
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Moyennes par critère</h2>
          <RatingRow label="Satisfaction globale" value={Number(avgOverall)} />
          <RatingRow label="Temps d'attente" value={Number(avgWait)} />
          <RatingRow label="Accueil" value={Number(avgReception)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Commentaires patients</h2>
          <div className="flex gap-2">
            {(['all', 'positive', 'negative'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'positive' ? 'Positifs' : 'Négatifs'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Chargement...</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Aucun feedback disponible</div>
        ) : (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {displayed.map(f => (
              <FeedbackCard key={f.id} feedback={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RatingRow({ label, value }: { label: string; value: number }) {
  const pct = isNaN(value) ? 0 : (value / 5) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{isNaN(value) ? '—' : value.toFixed(1)}/5</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const isPositive = feedback.overall_rating >= 4;
  const isNegative = feedback.overall_rating <= 2;
  return (
    <div className={`p-4 rounded-xl border transition-colors ${
      isPositive ? 'bg-green-50 border-green-200' :
      isNegative ? 'bg-red-50 border-red-200' :
      'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">{feedback.patient_name}</span>
            <StarDisplay value={feedback.overall_rating} />
          </div>
          {feedback.comment && (
            <p className="text-sm text-gray-700 italic">"{feedback.comment}"</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Attente : {feedback.wait_time_rating}/5</span>
            <span>Accueil : {feedback.reception_rating}/5</span>
            <span>{new Date(feedback.submitted_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        {isPositive && <ThumbsUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
        {isNegative && <ThumbsDown className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
      </div>
    </div>
  );
}
