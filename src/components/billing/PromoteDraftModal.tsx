import { useState } from 'react';
import { X, FileCheck, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { Invoice } from '../../types/database';
import { supabase } from '../../lib/supabase';

interface PromoteDraftModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: (newNumber: string) => void;
}

export function PromoteDraftModal({ invoice, onClose, onSuccess }: PromoteDraftModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const draftNumber = (invoice as any).draft_number ?? 'DRAFT-...';
  const patName = invoice.patient
    ? `${invoice.patient.first_name} ${invoice.patient.last_name}`
    : 'Patient inconnu';
  const netToPay = (invoice as any).net_to_pay ?? invoice.total_amount;

  async function handleConfirm() {
    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase
        .rpc('promote_draft_to_pending', { p_invoice_id: invoice.id });

      if (fnError) throw fnError;

      const generatedNumber = data as string;
      setNewNumber(generatedNumber);
      onSuccess(generatedNumber);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la validation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Valider le Brouillon</h2>
              <p className="text-xs text-gray-500">{draftNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {newNumber ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Facture validée</h3>
              <p className="text-sm text-gray-600 mb-3">Le numéro officiel a été attribué :</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 mb-6">
                <p className="text-2xl font-bold text-blue-700">{newNumber}</p>
              </div>
              {(invoice as any).type_facture !== 'conventionne' && (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl mb-4 text-sm text-green-700 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Facture envoyee a la caisse
                </div>
              )}
              <p className="text-sm text-gray-500 mb-6">
                La facture est maintenant en statut "En attente" et peut être envoyée au patient.
              </p>
              <button
                onClick={onClose}
                className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Action irréversible</p>
                  <p className="text-sm text-amber-700">
                    Cette action va générer un numéro officiel OKA-AAAA-MM-XXXX pour cette facture.
                    Le brouillon sera définitivement converti en facture "En attente".
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Patient</p>
                    <p className="font-medium text-gray-800">{patName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Net à payer</p>
                    <p className="font-bold text-blue-700">{netToPay.toFixed(2)} USD</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5 px-2">
                <div className="flex-1 text-center">
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 mb-1">Numéro actuel</div>
                  <p className="text-sm font-mono text-gray-500">{draftNumber}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 text-center">
                  <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs font-medium text-blue-700 mb-1">Nouveau numéro</div>
                  <p className="text-sm font-mono text-blue-600">OKA-AAAA-MM-XXXX</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileCheck className="w-4 h-4" />
                  )}
                  Confirmer et Générer le Numéro
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
