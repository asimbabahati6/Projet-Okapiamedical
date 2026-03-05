import { useEffect, useState } from 'react';
import { Plus, Search, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InsuranceProvider } from '../../types/drcClinic';
import { AddInsuranceModal } from '../../components/insurance/AddInsuranceModal';

export function InsurancePage() {
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading insurance providers:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function getProviderTypeBadge(type: string) {
    const styles = {
      mutual: 'bg-blue-100 text-blue-800',
      corporate: 'bg-green-100 text-green-800',
      government: 'bg-purple-100 text-purple-800',
      private: 'bg-yellow-100 text-yellow-800'
    };
    const labels = {
      mutual: 'Mutuelle',
      corporate: 'Entreprise',
      government: 'Gouvernement',
      private: 'Privé'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assurances Médicales</h1>
          <p className="text-gray-600 mt-1">Gestion des mutuelles et compagnies d'assurance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter Assurance
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Total Assurances</p>
          <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Mutuelles</p>
          <p className="text-2xl font-bold text-blue-600">
            {providers.filter(p => p.type === 'mutual').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Entreprises</p>
          <p className="text-2xl font-bold text-green-600">
            {providers.filter(p => p.type === 'corporate').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Actives</p>
          <p className="text-2xl font-bold text-emerald-600">
            {providers.filter(p => p.is_active).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher une assurance..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((provider) => (
          <div key={provider.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                {getProviderTypeBadge(provider.type)}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Code:</span> {provider.code}
              </p>
              {provider.contact_email && (
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {provider.contact_email}
                </p>
              )}
              {provider.contact_phone && (
                <p className="text-gray-600">
                  <span className="font-medium">Tél:</span> {provider.contact_phone}
                </p>
              )}
              {provider.tiers_payant_available && (
                <p className="text-gray-600">
                  <span className="font-medium text-green-600">✓</span> Tiers payant disponible
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddInsuranceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadProviders();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
