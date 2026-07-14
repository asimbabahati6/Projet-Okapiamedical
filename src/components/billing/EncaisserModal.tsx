import React from 'react';

export function EncaisserModal({ invoice, onClose, onSuccess }: { invoice: any; onClose: () => void; onSuccess: () => void }) {
  if (!invoice) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Encaisser</h2>
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de développement</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Fermer</button>
          <button onClick={onSuccess} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirmer</button>
        </div>
      </div>
    </div>
  );
}
