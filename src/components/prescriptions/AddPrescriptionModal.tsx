export default function AddPrescriptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h2 className="text-lg font-bold mb-4">Nouvelle Prescription</h2>
        <p className="text-gray-500 text-sm">Cette fonctionnalite est en cours de developpement.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Fermer</button>
      </div>
    </div>
  );
}
