import React from 'react';
import { FlaskConical } from 'lucide-react';

export const ResultsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Résultats</h1>
        <p className="text-gray-600 mt-2">Consultez vos résultats d'analyses</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Résultats analyses</h2>
        <p className="text-gray-600">
          Consultez vos résultats d'analyses médicales
        </p>
      </div>
    </div>
  );
};
