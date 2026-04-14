import { useState, useEffect, useMemo } from 'react';
import {
  Star, MessageSquare, ThumbsUp, ThumbsDown, BarChart2,
  TrendingUp, TrendingDown, RefreshCw, ShieldAlert, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
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
  weekIndex: number;
}

const ALLOWED_ROLES = [
  'super_admin', 'hospital_admin', 'medecin_chef_staff',
  'medical_director', 'admin', 'directeur_general'
];

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-teal-500', 'bg-cyan-600', 'bg-sky-600',
  'bg-slate-500', 'bg-zinc-600', 'bg-stone-500', 'bg-neutral-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || '?';
}

function getRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function StarDisplay({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`${cls} ${s <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </span>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color =
    value >= 4 ? 'bg-green-100 text-green-700' :
    value >= 3 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label} {value}/5
    </span>
  );
}

function KPICard({
  icon: Icon, label, value, color, sub, trend
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
  trend?: 'up' | 'down' | null;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2 leading-tight">{label}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          {sub && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
              <p className={`text-xs font-medium ${
                trend === 'up' ? 'text-green-600' :
                trend === 'down' ? 'text-red-600' :
                'text-gray-400'
              }`}>{sub}</p>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0 ml-3`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function RatingRow({ label, value }: { label: string; value: number }) {
  const isValid = !isNaN(value) && value > 0;
  const pct = isValid ? (value / 5) * 100 : 0;
  const barColor = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {isValid && <StarDisplay value={Math.round(value)} size="sm" />}
          <span className={`text-sm font-bold ${
            !isValid ? 'text-gray-400' :
            value >= 4 ? 'text-green-600' :
            value >= 3 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {isValid ? `${value.toFixed(1)}/5` : '—/5'}
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-blue-600 font-medium">{payload[0].value} feedback{payload[0].value > 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
};

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const isPositive = feedback.overall_rating >= 4;
  const isNegative = feedback.overall_rating <= 2;
  const avatarColor = getAvatarColor(feedback.patient_name);
  const initials = getInitials(feedback.patient_name);
  const relDate = getRelativeDate(feedback.submitted_at);
  const fullDate = new Date(feedback.submitted_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
      isPositive ? 'bg-green-50/60 border-green-200' :
      isNegative ? 'bg-red-50/60 border-red-200' :
      'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900">{feedback.patient_name}</span>
              <StarDisplay value={feedback.overall_rating} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isPositive && <ThumbsUp className="w-3.5 h-3.5 text-green-500" />}
              {isNegative && <ThumbsDown className="w-3.5 h-3.5 text-red-500" />}
              <span className="text-xs text-gray-400" title={fullDate}>{relDate}</span>
            </div>
          </div>
          {feedback.comment && (
            <p className="text-sm text-gray-700 italic mb-2 leading-relaxed">
              &ldquo;{feedback.comment}&rdquo;
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <ScorePill label="Attente" value={feedback.wait_time_rating} />
            <ScorePill label="Accueil" value={feedback.reception_rating} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedbackDashboard() {
  const { profile } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [visibleCount, setVisibleCount] = useState(10);

  const userRole = (profile?.role as { name?: string } | null)?.name || '';
  const hasAccess = ALLOWED_ROLES.includes(userRole);

  useEffect(() => {
    if (hasAccess) fetchFeedbacks();
  }, [hasAccess]);

  async function fetchFeedbacks(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const { data } = await supabase
      .from('patient_feedbacks')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(200);

    setFeedbacks(data || []);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }

  const stats = useMemo(() => {
    if (!feedbacks.length) return null;
    const avgOverall = feedbacks.reduce((s, f) => s + f.overall_rating, 0) / feedbacks.length;
    const avgWait = feedbacks.reduce((s, f) => s + f.wait_time_rating, 0) / feedbacks.length;
    const avgReception = feedbacks.reduce((s, f) => s + f.reception_rating, 0) / feedbacks.length;
    const positive = feedbacks.filter(f => f.overall_rating >= 4);
    const negative = feedbacks.filter(f => f.overall_rating <= 2);
    return {
      avgOverall,
      avgWait,
      avgReception,
      positive,
      negative,
      positivePct: Math.round((positive.length / feedbacks.length) * 100),
      negativePct: Math.round((negative.length / feedbacks.length) * 100),
    };
  }, [feedbacks]);

  const weeklyData: WeeklyVolume[] = useMemo(() => {
    const weeklyMap: Record<string, { count: number; weekIndex: number }> = {};
    feedbacks.forEach(f => {
      const d = new Date(f.submitted_at);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const label = monday.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const weekIndex = Math.floor(monday.getTime() / (7 * 24 * 60 * 60 * 1000));
      if (!weeklyMap[label]) weeklyMap[label] = { count: 0, weekIndex };
      weeklyMap[label].count += 1;
    });

    return Object.entries(weeklyMap)
      .map(([week, { count, weekIndex }]) => ({ week, count, weekIndex }))
      .sort((a, b) => a.weekIndex - b.weekIndex)
      .slice(-8);
  }, [feedbacks]);

  const displayed = useMemo(() => feedbacks.filter(f => {
    if (filter === 'positive') return f.overall_rating >= 4;
    if (filter === 'negative') return f.overall_rating <= 2;
    return true;
  }), [feedbacks, filter]);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold">Accès restreint</p>
          <p className="text-gray-400 text-sm">Cette page est réservée à la Direction.</p>
        </div>
      </div>
    );
  }

  const lastUpdated = feedbacks.length > 0
    ? new Date(feedbacks[0].submitted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tableau de Bord Satisfaction</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Vue Super-Utilisateur &mdash; Prof BAZEBOSO J.A.
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">Dernier feedback : {lastUpdated}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">En direct</span>
          </div>
          <button
            onClick={() => fetchFeedbacks(true)}
            disabled={refreshing}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2 leading-tight">Note moyenne globale</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats ? stats.avgOverall.toFixed(1) : '—'}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                {stats
                  ? <StarDisplay value={Math.round(stats.avgOverall)} size="sm" />
                  : <span className="text-xs text-gray-400">/5 étoiles</span>
                }
                {stats && (
                  <span className="text-xs text-gray-400 ml-1">/5 étoiles</span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0 ml-3">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </div>

        <KPICard
          icon={MessageSquare}
          label="Total feedbacks"
          value={feedbacks.length}
          color="bg-blue-500"
          sub={feedbacks.length > 0 ? `${feedbacks.length} retour${feedbacks.length > 1 ? 's' : ''} collecté${feedbacks.length > 1 ? 's' : ''}` : undefined}
        />

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2 leading-tight">Avis positifs (≥4)</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats ? stats.positive.length : 0}
              </p>
              <div className="mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {stats ? stats.positivePct : 0}% des retours
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 ml-3">
              <ThumbsUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2 leading-tight">Avis négatifs (≤2)</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats ? stats.negative.length : 0}
              </p>
              <div className="mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  {stats ? stats.negativePct : 0}% des retours
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 ml-3">
              <ThumbsDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Volume de feedbacks par semaine</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">8 dernières semaines</p>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : weeklyData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
              <BarChart2 className="w-10 h-10 text-gray-200" />
              <span className="text-sm">Aucune donnée</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 4 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {weeklyData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === weeklyData.length - 1 ? '#2563eb' : '#93c5fd'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Averages by Criterion */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Moyennes par critère</h2>
          <p className="text-xs text-gray-400 mb-3">Sur {feedbacks.length} évaluation{feedbacks.length !== 1 ? 's' : ''}</p>
          <div className="space-y-0">
            <RatingRow
              label="Satisfaction globale"
              value={stats ? stats.avgOverall : NaN}
            />
            <RatingRow
              label="Temps d'attente"
              value={stats ? stats.avgWait : NaN}
            />
            <RatingRow
              label="Accueil"
              value={stats ? stats.avgReception : NaN}
            />
          </div>

          {stats && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Score global</span>
                <span className={`font-bold text-sm ${
                  stats.avgOverall >= 4 ? 'text-green-600' :
                  stats.avgOverall >= 3 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {((stats.avgOverall + stats.avgWait + stats.avgReception) / 3).toFixed(1)}/5
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900">Commentaires patients</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {displayed.length} commentaire{displayed.length !== 1 ? 's' : ''}
              {filter !== 'all' ? ` (filtrés)` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {(['all', 'positive', 'negative'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setVisibleCount(10); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? f === 'all' ? 'bg-blue-600 text-white shadow-sm'
                      : f === 'positive' ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'positive' ? 'Positifs' : 'Négatifs'}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  filter === f ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {f === 'all' ? feedbacks.length
                    : f === 'positive' ? feedbacks.filter(fb => fb.overall_rating >= 4).length
                    : feedbacks.filter(fb => fb.overall_rating <= 2).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Chargement des feedbacks...</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <MessageSquare className="w-10 h-10 text-gray-200" />
            <span className="text-sm">Aucun feedback disponible</span>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.slice(0, visibleCount).map(f => (
              <FeedbackCard key={f.id} feedback={f} />
            ))}

            {visibleCount < displayed.length && (
              <button
                onClick={() => setVisibleCount(c => c + 10)}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors border border-dashed border-blue-200"
              >
                <ChevronDown className="w-4 h-4" />
                Charger plus ({displayed.length - visibleCount} restants)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
