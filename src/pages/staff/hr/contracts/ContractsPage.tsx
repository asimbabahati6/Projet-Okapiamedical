import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Calendar, Users } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { AddContractModal } from '../../../../components/contracts/AddContractModal';

interface Contract {
  id: string;
  employee_name: string;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  status: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    try {
      const { data } = await supabase
        .from('employee_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setContracts(data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          employee_name: (c.employee_name as string) || 'N/A',
          contract_type: (c.contract_type as string) || 'CDI',
          start_date: (c.start_date as string) || '',
          end_date: c.end_date as string | null,
          status: (c.status as string) || 'active',
        })));
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = contracts.filter(c =>
    c.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Gestion des Contrats
          </h1>
          <p className="text-gray-500 mt-1">Gérer les contrats du personnel</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau contrat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contrats actifs</p>
              <p className="text-xl font-bold text-gray-900">
                {contracts.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expirent bientôt</p>
              <p className="text-xl font-bold text-gray-900">
                {contracts.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total contrats</p>
              <p className="text-xl font-bold text-gray-900">{contracts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un contrat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            Filtrer
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun contrat trouvé</p>
            <p className="text-sm text-gray-400 mt-1">Les contrats ajoutés apparaîtront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employé</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Début</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fin</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{contract.employee_name}</td>
                    <td className="px-4 py-3 text-gray-600">{contract.contract_type}</td>
                    <td className="px-4 py-3 text-gray-600">{contract.start_date}</td>
                    <td className="px-4 py-3 text-gray-600">{contract.end_date || 'Indéterminé'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(contract.status)}`}>
                        {contract.status === 'active' ? 'Actif' : contract.status === 'expired' ? 'Expiré' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddContractModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchContracts(); }}
        />
      )}
    </div>
  );
}
