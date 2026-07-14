import React from 'react';

export default function InventoryList({ onAddItem, onEditItem, onViewDetails }: { onAddItem: () => void; onEditItem: (item: any) => void; onViewDetails: (item: any) => void }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Inventaire</h2>
        <button onClick={onAddItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ajouter</button>
      </div>
      <p className="text-gray-500">Liste d'inventaire en cours de développement</p>
    </div>
  );
}
