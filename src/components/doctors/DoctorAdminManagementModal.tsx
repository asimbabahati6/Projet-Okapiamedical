import React from 'react';

export default function DoctorAdminManagementModal({ isOpen, onClose, doctor }: { isOpen: boolean; onClose: () => void; doctor: any }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Gestion Administrateur Médecin</h2>
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de développement</p>
        <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Fermer</button>
      </div>
    </div>
  );
}
