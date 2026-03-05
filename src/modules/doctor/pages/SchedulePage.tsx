import React from 'react';
import { Calendar } from 'lucide-react';

export const SchedulePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Agenda</h1>
        <p className="text-gray-600 mt-2">Gérez votre planning de consultations</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Planning médecin</h2>
        <p className="text-gray-600">
          Visualisez et gérez vos rendez-vous
        </p>
      </div>
    </div>
  );
};
