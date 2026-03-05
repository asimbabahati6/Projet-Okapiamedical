import { useState } from 'react';
import { X, DollarSign, Calendar, User, FileText, CreditCard, Building2, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface Expense {
  id: string;
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  vendor?: string;
  receipt_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  created_by_user?: {
    full_name: string;
  };
}

interface ExpenseDetailsModalProps {
  expense: Expense;
  onClose: () => void;
  onUpdate: () => void;
  categories: Array<{ value: string; label: string; icon: string }>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement Bancaire',
  check: 'Chèque',
  card: 'Carte',
  mobile_money: 'Mobile Money',
};

export default function ExpenseDetailsModal({
  expense,
  onClose,
  onUpdate,
  categories,
}: ExpenseDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  async function handleDelete() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);

      if (error) throw error;

      success('Dépense supprimée avec succès');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error deleting expense:', err);
      showError('Erreur lors de la suppression de la dépense');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function getCategoryInfo(category: string) {
    return categories.find((c) => c.value === category) || categories[9];
  }

  const catInfo = getCategoryInfo(expense.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Détails de la Dépense</h2>
              <p className="text-sm text-gray-600">Reçu #{expense.receipt_number || expense.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
            <p className="text-sm text-blue-600 font-medium mb-2">Montant Total</p>
            <p className="text-4xl font-bold text-blue-900">
              {formatCurrency(expense.amount)}
            </p>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Catégorie</span>
              </div>
              <p className="font-semibold text-gray-900">
                {catInfo.icon} {catInfo.label}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Date</span>
              </div>
              <p className="font-semibold text-gray-900">
                {new Date(expense.expense_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-900 bg-gray-50 rounded-lg p-4">
              {expense.description}
            </p>
          </div>

          {/* Payment Details */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Détails de Paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Méthode de Paiement</p>
                  <p className="font-semibold text-gray-900">
                    {PAYMENT_METHOD_LABELS[expense.payment_method] || expense.payment_method}
                  </p>
                </div>
              </div>

              {expense.vendor && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Fournisseur</p>
                    <p className="font-semibold text-gray-900">{expense.vendor}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                {expense.notes}
              </p>
            </div>
          )}

          {/* Meta Information */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>
                Enregistré par{' '}
                <span className="font-medium text-gray-900">
                  {expense.created_by_user?.full_name || 'Inconnu'}
                </span>
              </span>
              <span className="text-gray-400">•</span>
              <span>
                {new Date(expense.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading || isEditing}
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
          </div>

          {isEditing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Fonctionnalité de modification en cours de développement
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
