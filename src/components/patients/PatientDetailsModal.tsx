import React from 'react';

export function PatientDetailsModal({ patient, onClose, onEdit }: { patient: any; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-lg font-semibold mb-4">Détails du Patient</h2>
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de développement</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Fermer</button>
          <button onClick={onEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Modifier</button>
        </div>
      </div>
    </div>
  );
}
