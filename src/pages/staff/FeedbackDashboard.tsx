import { useState, useEffect } from 'react';
import { MessageCircle, Star, TrendingUp, Users, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FeedbackEntry {
  id: string;
  patient_name: string;
  rating: number;
  comment: string;
  department: string;
  created_at: string;
}

export function FeedbackDashboard() {
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks() {
    try {
      const { data } = await supabase
        .from('patient_feedbacks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setFeedbacks(data.map((f: Record<string, unknown>) => ({
          id: f.id as string,
          patient_name: (f.patient_name as string) || 'Anonyme',
          rating: Number(f.rating || f.overall_rating || 3),
          comment: (f.comment as string) || (f.comments as string) || '',
          department: (f.department as string) || 'Général',
          created_at: f.created_at as string,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0';
  const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
  const negativeCount = feedbacks.filter(f => f.rating <= 2).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-blue-600" />
          Retours Patients
        </h1>
        <p className="text-gray-500 mt-1">Suivi de la satisfaction des patients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Note moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{avgRating}/5</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Positifs</p>
              <p className="text-2xl font-bold text-gray-900">{positiveCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <ThumbsDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Négatifs</p>
              <p className="text-2xl font-bold text-gray-900">{negativeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total réponses</p>
              <p className="text-2xl font-bold text-gray-900">{feedbacks.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Retours récents</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun retour patient</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{fb.patient_name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{fb.department}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                {fb.comment && (
                  <p className="text-sm text-gray-600">{fb.comment}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(fb.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
