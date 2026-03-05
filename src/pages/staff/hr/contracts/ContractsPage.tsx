import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Eye, Edit, RefreshCw, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getContracts, getContractStats, deleteContract } from '../../../../services/contractService';
import { ContractWithEmployee, ContractStats } from '../../../../types/contracts';
import { AddContractModal } from '../../../../components/contracts/AddContractModal';
import { EditContractModal } from '../../../../components/contracts/EditContractModal';
import { ContractDetailsModal } from '../../../../components/contracts/ContractDetailsModal';
import { RenewContractModal } from '../../../../components/contracts/RenewContractModal';
import { useToast } from '../../../../hooks/useToast';
import { useAuth } from '../../../../contexts/AuthContext';

export default function ContractsPage() {
  const { profile, isRole } = useAuth();
  const [contracts, setContracts] = useState<ContractWithEmployee[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractWithEmployee[]>([]);
  const [stats, setStats] = useState<ContractStats>({ total: 0, active: 0, expiring_soon: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithEmployee | null>(null);

  const { showToast } = useToast();

  const hasAccess = isRole(['super_admin', 'hospital_admin', 'medical_director', 'hr_manager', 'administrative_director', 'administrative_staff']);

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter, typeFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [contractsData, statsData] = await Promise.all([
        getContracts(),
        getContractStats()
      ]);
      setContracts(contractsData);
      setStats(statsData);
    } catch (error: any) {
      showToast('Erreur lors du chargement des contrats', 'error');
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterContracts() {
    let filtered = contracts;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.contract_number.toLowerCase().includes(search) ||
          c.employee_name.toLowerCase().includes(search) ||
          c.position.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'expiring') {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        filtered = filtered.filter(c => {
          if (c.contract_status !== 'active' || !c.end_date) return false;
          const endDate = new Date(c.end_date);
          return endDate >= today && endDate <= futureDate;
        });
      } else {
        filtered = filtered.filter(c => c.contract_status === statusFilter);
      }
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.contract_type === typeFilter);
    }

    setFilteredContracts(filtered);
  }

  function handleDelete(contract: ContractWithEmployee) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le contrat ${contract.contract_number}?`)) {
      deleteContract(contract.id)
        .then(() => {
          showToast('Contrat supprimé avec succès', 'success');
          loadData();
        })
        .catch(error => {
          showToast('Erreur lors de la suppression du contrat', 'error');
          console.error('Error deleting contract:', error);
        });
    }
  }

  function handleView(contract: ContractWithEmployee) {
    setSelectedContract(contract);
    setShowDetailsModal(true);
  }

  function handleEdit(contract: ContractWithEmployee) {
    setSelectedContract(contract);
    setShowEditModal(true);
  }

  function handleRenew(contract: ContractWithEmployee) {
    setSelectedContract(contract);
    setShowRenewModal(true);
  }

  function getStatusBadge(status: string) {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Actif' },
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Brouillon' },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Expiré' },
      terminated: { color: 'bg-orange-100 text-orange-800', icon: XCircle, label: 'Terminé' },
      pending_renewal: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'En attente' }
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  }

  function getTypeBadge(type: string) {
    const colors = {
      CDI: 'bg-blue-100 text-blue-800',
      CDD: 'bg-purple-100 text-purple-800',
      Stage: 'bg-yellow-100 text-yellow-800',
      Freelance: 'bg-green-100 text-green-800',
      Interim: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  }

  function isExpiringSoon(contract: ContractWithEmployee): boolean {
    if (!contract.end_date || contract.contract_status !== 'active') return false;
    const today = new Date();
    const endDate = new Date(contract.end_date);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!hasAccess) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
          <p className="text-gray-600 mb-2">
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des contrats.
          </p>
          <p className="text-sm text-gray-500">
            Cette page est réservée aux Super-Utilisateurs, Médecins Directeurs, et Responsables RH.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Contrats du Personnel</h1>
          <p className="text-gray-600">Module Ressources Humaines - Gérer les contrats des employés</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nouveau Contrat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Contrats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contrats Actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expirent Bientôt</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiring_soon}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expirés</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par numéro, employé, poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="draft">Brouillons</option>
            <option value="expiring">Expirent bientôt</option>
            <option value="expired">Expirés</option>
            <option value="terminated">Terminés</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Stage">Stage</option>
            <option value="Freelance">Freelance</option>
            <option value="Interim">Intérim</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrat</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poste</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salaire</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Aucun contrat trouvé
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className={`hover:bg-gray-50 ${isExpiringSoon(contract) ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{contract.contract_number}</div>
                      {isExpiringSoon(contract) && (
                        <div className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          Expire bientôt
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{contract.employee_name}</div>
                      <div className="text-xs text-gray-500">{contract.employee_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{contract.position}</div>
                      {contract.department_name && (
                        <div className="text-xs text-gray-500">{contract.department_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getTypeBadge(contract.contract_type)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{formatDate(contract.start_date)}</div>
                        <div className="text-gray-500">{formatDate(contract.end_date)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{formatCurrency(contract.base_salary_cdf)} CDF</div>
                      {contract.base_salary_usd && (
                        <div className="text-xs text-gray-500">${formatCurrency(contract.base_salary_usd)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(contract.contract_status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(contract)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(contract)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {contract.contract_status === 'active' && contract.end_date && (
                          <button
                            onClick={() => handleRenew(contract)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Renouveler"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(contract)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddContractModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadData();
            showToast('Contrat créé avec succès', 'success');
          }}
        />
      )}

      {showEditModal && selectedContract && (
        <EditContractModal
          contract={selectedContract}
          onClose={() => {
            setShowEditModal(false);
            setSelectedContract(null);
          }}
          onSuccess={() => {
            loadData();
            showToast('Contrat modifié avec succès', 'success');
          }}
        />
      )}

      {showDetailsModal && selectedContract && (
        <ContractDetailsModal
          contract={selectedContract}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedContract(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
          onRenew={() => {
            setShowDetailsModal(false);
            setShowRenewModal(true);
          }}
        />
      )}

      {showRenewModal && selectedContract && (
        <RenewContractModal
          contract={selectedContract}
          onClose={() => {
            setShowRenewModal(false);
            setSelectedContract(null);
          }}
          onSuccess={() => {
            loadData();
            showToast('Contrat renouvelé avec succès', 'success');
          }}
        />
      )}
    </div>
  );
}
