import { useState } from 'react';
import { X, DollarSign, Calendar, User, FileText, CreditCard, Building2, CreditCard as Edit, Trash2, Printer } from 'lucide-react';
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
  devise?: string;
  taux_applique?: number;
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

  function formatCurrency(amount: number, devise?: string) {
    if (devise === 'CDF') return `${Math.round(amount).toLocaleString('fr-FR')} CDF`;
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function getCategoryInfo(category: string) {
    return categories.find((c) => c.value === category) || categories[9];
  }

  function handlePrintReceipt() {
    const creatorName = expense.created_by_user?.full_name || '\u2014';
    const catLabel = getCategoryInfo(expense.category);
    const paymentLabel = PAYMENT_METHOD_LABELS[expense.payment_method] || expense.payment_method;
    const dateStr = new Date(expense.expense_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const createdAtStr = new Date(expense.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const receiptNum = expense.receipt_number || expense.id.slice(0, 8).toUpperCase();

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Recu Depense - ${receiptNum}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a1a1a; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; color: #2563eb; margin-bottom: 4px; }
    .header .receipt-num { font-size: 13px; color: #666; }
    .amount-box { background: #eff6ff; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px; }
    .amount-box .label { font-size: 12px; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .amount-box .value { font-size: 28px; font-weight: 700; color: #1e3a5f; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .row .lbl { color: #666; }
    .row .val { font-weight: 600; color: #1a1a1a; text-align: right; max-width: 60%; }
    .description { background: #f9fafb; border-radius: 6px; padding: 12px; font-size: 13px; color: #374151; margin-bottom: 16px; }
    .footer { border-top: 2px solid #2563eb; padding-top: 16px; margin-top: 24px; }
    .footer .operator { font-size: 13px; color: #374151; margin-bottom: 4px; }
    .footer .operator strong { color: #1a1a1a; }
    .footer .timestamp { font-size: 11px; color: #999; }
    .print-hide { margin-top: 24px; text-align: center; }
    .print-hide button { background: #2563eb; color: #fff; border: none; padding: 10px 32px; border-radius: 6px; font-size: 14px; cursor: pointer; }
    @media print { .print-hide { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>BON DE DEPENSE</h1>
    <div class="receipt-num">Recu N&deg; ${receiptNum}</div>
  </div>

  <div class="amount-box">
    <div class="label">Montant</div>
    <div class="value">${formatCurrency(expense.amount, expense.devise)}</div>
  </div>

  <div class="section">
    <div class="section-title">Informations</div>
    <div class="row"><span class="lbl">Date</span><span class="val">${dateStr}</span></div>
    <div class="row"><span class="lbl">Categorie</span><span class="val">${catLabel.label}</span></div>
    <div class="row"><span class="lbl">Methode de paiement</span><span class="val">${paymentLabel}</span></div>
    <div class="row"><span class="lbl">Devise</span><span class="val">${expense.devise || 'USD'}</span></div>
    ${expense.taux_applique ? `<div class="row"><span class="lbl">Taux applique</span><span class="val">1 USD = ${expense.taux_applique.toLocaleString('fr-FR')} CDF</span></div>` : ''}
    ${expense.devise === 'CDF' && expense.taux_applique ? `<div class="row"><span class="lbl">Equivalent USD</span><span class="val">${(expense.amount / expense.taux_applique).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span></div>` : ''}
    ${expense.devise !== 'CDF' && expense.taux_applique ? `<div class="row"><span class="lbl">Equivalent CDF</span><span class="val">${Math.round(expense.amount * expense.taux_applique).toLocaleString('fr-FR')} CDF</span></div>` : ''}
    ${expense.vendor ? `<div class="row"><span class="lbl">Fournisseur</span><span class="val">${expense.vendor}</span></div>` : ''}
    ${expense.receipt_number ? `<div class="row"><span class="lbl">N&deg; de recu</span><span class="val">${expense.receipt_number}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Description</div>
    <div class="description">${expense.description}</div>
  </div>

  ${expense.notes ? `<div class="section"><div class="section-title">Notes</div><div class="description">${expense.notes}</div></div>` : ''}

  <div class="footer">
    <div class="operator">Enregistre par : <strong>${creatorName}</strong></div>
    <div class="timestamp">${createdAtStr}</div>
  </div>

  <div class="print-hide">
    <button onclick="window.print()">Imprimer</button>
  </div>
</body>
</html>`);
    printWindow.document.close();
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
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReceipt}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Imprimer le reçu"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
            <p className="text-sm text-blue-600 font-medium mb-2">Montant Total</p>
            <p className="text-4xl font-bold text-blue-900">
              {formatCurrency(expense.amount, expense.devise)}
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

              {expense.devise && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Devise</p>
                    <p className="font-semibold text-gray-900">{expense.devise}</p>
                    {expense.taux_applique && (
                      <p className="text-xs text-gray-400">1 USD = {expense.taux_applique.toLocaleString('fr-FR')} CDF</p>
                    )}
                  </div>
                </div>
              )}

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
