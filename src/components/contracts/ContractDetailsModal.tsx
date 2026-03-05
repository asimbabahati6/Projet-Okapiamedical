import { X, FileText, Calendar, DollarSign, User, Building } from 'lucide-react';
import { ContractWithEmployee } from '../../types/contracts';

interface ContractDetailsModalProps {
  contract: ContractWithEmployee;
  onClose: () => void;
  onEdit: () => void;
  onRenew: () => void;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'terminated': return 'bg-orange-100 text-orange-800';
    case 'pending_renewal': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Actif';
    case 'draft': return 'Brouillon';
    case 'expired': return 'Expiré';
    case 'terminated': return 'Terminé';
    case 'pending_renewal': return 'En attente de renouvellement';
    default: return status;
  }
}

function getContractTypeLabel(type: string): string {
  switch (type) {
    case 'CDI': return 'Contrat à Durée Indéterminée';
    case 'CDD': return 'Contrat à Durée Déterminée';
    case 'Stage': return 'Stage';
    case 'Freelance': return 'Freelance';
    case 'Interim': return 'Intérim';
    default: return type;
  }
}

export function ContractDetailsModal({ contract, onClose, onEdit, onRenew }: ContractDetailsModalProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Détails du Contrat</h2>
            <p className="text-sm text-gray-500">{contract.contract_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.contract_status)}`}>
              {getStatusLabel(contract.contract_status)}
            </span>
            <span className="text-sm text-gray-600">{getContractTypeLabel(contract.contract_type)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User className="w-4 h-4" />
                  <h3 className="font-semibold">Informations Employé</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Nom:</span>
                    <p className="font-medium">{contract.employee_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="text-sm">{contract.employee_email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Poste:</span>
                    <p className="font-medium">{contract.position}</p>
                  </div>
                  {contract.department_name && (
                    <div>
                      <span className="text-sm text-gray-600">Département:</span>
                      <p className="font-medium">{contract.department_name}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  <h3 className="font-semibold">Dates du Contrat</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Date de début:</span>
                    <p className="font-medium">{formatDate(contract.start_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Date de fin:</span>
                    <p className="font-medium">{formatDate(contract.end_date)}</p>
                  </div>
                  {contract.duration_months && (
                    <div>
                      <span className="text-sm text-gray-600">Durée:</span>
                      <p className="font-medium">{contract.duration_months} mois</p>
                    </div>
                  )}
                  {contract.termination_date && (
                    <div>
                      <span className="text-sm text-gray-600">Date de résiliation:</span>
                      <p className="font-medium text-red-600">{formatDate(contract.termination_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <h3 className="font-semibold">Informations Financières</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Salaire de base (CDF):</span>
                    <p className="font-medium text-lg">{formatCurrency(contract.base_salary_cdf)} CDF</p>
                  </div>
                  {contract.base_salary_usd && (
                    <div>
                      <span className="text-sm text-gray-600">Salaire de base (USD):</span>
                      <p className="font-medium text-lg">${formatCurrency(contract.base_salary_usd)}</p>
                    </div>
                  )}
                  {contract.benefits && Object.keys(contract.benefits).length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Avantages:</span>
                      <div className="mt-1 text-sm">
                        {Object.entries(contract.benefits).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span>{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <FileText className="w-4 h-4" />
                  <h3 className="font-semibold">Informations Additionnelles</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Nombre de renouvellements:</span>
                    <p className="font-medium">{contract.renewal_count}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Alerte renouvellement:</span>
                    <p className="font-medium">{contract.renewal_alert_days} jours avant</p>
                  </div>
                  {contract.previous_contract_id && (
                    <div>
                      <span className="text-sm text-gray-600">Contrat précédent:</span>
                      <p className="text-sm text-blue-600">Oui</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-600">Créé le:</span>
                    <p className="text-sm">{formatDate(contract.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Mis à jour le:</span>
                    <p className="text-sm">{formatDate(contract.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {contract.termination_reason && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Raison de la Résiliation</h3>
              <p className="text-sm text-red-700">{contract.termination_reason}</p>
            </div>
          )}

          {contract.notes && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Notes</h3>
              <p className="text-sm text-blue-700">{contract.notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Fermer
            </button>
            {contract.contract_status === 'active' && contract.end_date && (
              <button
                onClick={onRenew}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Renouveler
              </button>
            )}
            {contract.contract_status !== 'terminated' && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Modifier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
