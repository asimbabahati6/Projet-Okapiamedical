import React from 'react';
import { User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-600 mt-2">Gérez vos informations personnelles</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Profil patient</h2>
        <p className="text-gray-600">
          Mettez à jour vos informations personnelles et vos préférences
        </p>
      </div>
    </div>
  );
};
