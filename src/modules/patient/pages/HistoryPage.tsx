import React from 'react';
import { History } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Historique</h1>
        <p className="text-gray-600 mt-2">Consultez votre historique médical</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Historique médical</h2>
        <p className="text-gray-600">
          Consultez l'historique de vos consultations et traitements
        </p>
      </div>
    </div>
  );
};
