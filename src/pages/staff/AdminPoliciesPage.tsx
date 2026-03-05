import { useState, useEffect } from 'react';
import { FileText, Plus, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Policy {
  id: string;
  policy_title: string;
  policy_number: string;
  policy_category: string;
  status: string;
  effective_date: string;
  review_date: string;
}

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('administrative_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Politiques et Procédures</h1>
          <p className="text-gray-600">Gestion des politiques administratives</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle politique
        </button>
      </div>

      {policies.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune politique</h3>
          <p className="text-gray-500">Créez votre première politique administrative</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.map((policy) => (
            <div key={policy.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <FileText className="h-8 w-8 text-teal-600" />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                  {policy.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{policy.policy_title}</h3>
              <p className="text-sm text-gray-600 mb-4">Numéro: {policy.policy_number}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Catégorie: {policy.policy_category}</div>
                <div>Effective: {new Date(policy.effective_date).toLocaleDateString('fr-FR')}</div>
                {policy.review_date && (
                  <div>Révision: {new Date(policy.review_date).toLocaleDateString('fr-FR')}</div>
                )}
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                Voir détails
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
