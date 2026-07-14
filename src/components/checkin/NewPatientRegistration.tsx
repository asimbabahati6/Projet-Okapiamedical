import React from 'react';

export function NewPatientRegistration({ patient, checkInId, queueNumber, onClose, onComplete }: { patient: any; checkInId: string; queueNumber: number; onClose: () => void; onComplete: () => void }) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Enregistrement Nouveau Patient</h2>
      <p className="text-gray-500 mb-4">Numéro de file: {queueNumber}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
        <button onClick={onComplete} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Terminer</button>
      </div>
    </div>
  );
}
