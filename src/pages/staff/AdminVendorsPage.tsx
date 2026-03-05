import { useState, useEffect } from 'react';
import { Building, Plus, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VendorContract {
  id: string;
  vendor_name: string;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  contract_value_usd: number;
  status: string;
  performance_rating: number;
}

export default function AdminVendorsPage() {
  const [contracts, setContracts] = useState<VendorContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_contracts')
        .select('*')
        .order('end_date', { ascending: true });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'terminated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpiringSoon = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const daysUntilExpiry = Math.floor((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
          <p className="text-gray-600">Contrats et relations avec les fournisseurs</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Nouveau contrat
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contrat</h3>
          <p className="text-gray-500">Commencez par ajouter un contrat fournisseur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${
                isExpiringSoon(contract.end_date) ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <Building className="h-8 w-8 text-teal-600" />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                  {contract.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">{contract.vendor_name}</h3>
              <p className="text-sm text-gray-600 mb-4">{contract.contract_number}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2">Type:</span>
                  <span>{contract.contract_type}</span>
                </div>

                {contract.contract_value_usd && (
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                    <span>${contract.contract_value_usd.toLocaleString('en-US')}</span>
                  </div>
                )}

                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {new Date(contract.start_date).toLocaleDateString('fr-FR')} - {new Date(contract.end_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {isExpiringSoon(contract.end_date) && (
                  <div className="flex items-center px-2 py-1 bg-yellow-50 text-yellow-800 rounded text-xs font-medium">
                    Expire dans moins de 30 jours
                  </div>
                )}

                {contract.performance_rating && (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600 mr-2">Performance:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${star <= contract.performance_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm">
                  Voir
                </button>
                {contract.status === 'active' && isExpiringSoon(contract.end_date) && (
                  <button className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                    Renouveler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
