import React from 'react';

export function EnhancedDocumentGenerator({ onClose, patient, documentType }: { onClose: () => void; patient: any; documentType: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-lg font-semibold mb-4">Générateur de Documents</h2>
        <p className="text-gray-500 mb-4">Type: {documentType}</p>
        <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Fermer</button>
      </div>
    </div>
  );
}
