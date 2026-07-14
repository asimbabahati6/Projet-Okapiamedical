import React from 'react';

export function PrintableInvoiceView({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Apercu Facture</h2>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Fermer</button>
        </div>
        <p className="text-gray-500">Aperçu de la facture en cours de développement</p>
      </div>
    </div>
  );
}
