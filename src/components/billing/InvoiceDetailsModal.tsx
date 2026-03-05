import { X, User, Calendar, DollarSign, CreditCard, FileText, CheckCircle, Clock } from 'lucide-react';
import { Invoice } from '../../types/database';
import { useState } from 'react';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  onClose: () => void;
  onPayment?: (invoiceId: string, amount: number, method: string) => void;
}

export function InvoiceDetailsModal({ invoice, onClose, onPayment }: InvoiceDetailsModalProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(invoice.balance.toString());
  const [paymentMethod, setPaymentMethod] = useState('cash');

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      partial: 'bg-orange-100 text-orange-800 border-orange-300',
      paid: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'En attente',
      partial: 'Partiel',
      paid: 'Payé',
      cancelled: 'Annulé',
    };
    return labels[status as keyof typeof labels] || status;
  }

  function formatCurrency(amount: number) {
    return `${amount.toFixed(2)} USD`;
  }

  function handleSubmitPayment() {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && amount <= invoice.balance && onPayment) {
      onPayment(invoice.id, amount, paymentMethod);
      setShowPaymentForm(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Détails de la Facture</h2>
            <p className="text-sm text-gray-600">{invoice.invoice_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(invoice.status)}`}>
                {invoice.status === 'paid' && <CheckCircle className="w-4 h-4" />}
                {invoice.status === 'pending' && <Clock className="w-4 h-4" />}
                {getStatusLabel(invoice.status)}
              </span>
              <div className="text-right">
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-semibold text-gray-900">
                  {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Montant Total</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(invoice.total_amount)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Montant Payé</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(invoice.paid_amount)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Solde Restant</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(invoice.balance)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informations Patient
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nom complet</p>
                    <p className="font-medium text-gray-900">
                      {invoice.patient?.first_name} {invoice.patient?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numéro patient</p>
                    <p className="font-medium text-gray-900">{invoice.patient?.patient_number}</p>
                  </div>
                  {invoice.patient?.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium text-gray-900">{invoice.patient.phone}</p>
                    </div>
                  )}
                  {invoice.patient?.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{invoice.patient.email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {invoice.payment_method && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Informations de Paiement
                </h4>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Méthode de paiement</p>
                      <p className="font-medium text-gray-900">{invoice.payment_method}</p>
                    </div>
                    {invoice.payment_date && (
                      <div>
                        <p className="text-sm text-gray-600">Date de paiement</p>
                        <p className="font-medium text-gray-900">
                          {new Date(invoice.payment_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {invoice.notes && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Notes
                </h4>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Historique
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Facture créée</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(invoice.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dernière mise à jour</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(invoice.updated_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                )}
                {invoice.payment_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paiement effectué</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(invoice.payment_date).toLocaleString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!showPaymentForm && (invoice.status === 'pending' || invoice.status === 'partial') && onPayment && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPaymentForm(true)}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                Effectuer un Paiement
              </button>
            </div>
          )}

          {showPaymentForm && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Enregistrer un Paiement</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant à payer
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={invoice.balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="insurance">Assurance</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitPayment}
                    className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Confirmer le Paiement
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
