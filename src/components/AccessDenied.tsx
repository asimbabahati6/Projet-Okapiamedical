import React from 'react';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  message?: string;
  description?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

export function AccessDenied({
  message = "Accès non autorisé",
  description = "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
  showHomeButton = true,
  showBackButton = false
}: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-70"></div>
              <div className="relative bg-red-100 rounded-full p-6">
                <AlertTriangle className="h-16 w-16 text-red-600" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {message}
          </h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {description}
          </p>

          <div className="space-y-3">
            {showHomeButton && (
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Home className="h-5 w-5" />
                <span>Retour à l'accueil</span>
              </button>
            )}

            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Retour</span>
              </button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur système.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
