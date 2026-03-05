import React from 'react';
import { FileText } from 'lucide-react';

export const PrescriptionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Ordonnances</h1>
        <p className="text-gray-600 mt-2">Consultez vos ordonnances</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Mes ordonnances</h2>
        <p className="text-gray-600">
          Consultez et gérez vos ordonnances médicales
        </p>
      </div>
    </div>
  );
};
