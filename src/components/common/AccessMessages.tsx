import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AccessMessageProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function LimitedAccessNotice({ title, message, action }: AccessMessageProps) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
      <div className="flex items-start">
        <Info className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">{title}</h3>
          <p className="mt-1 text-sm text-blue-700">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccessDeniedMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function ReadOnlyNotice({ message }: { message?: string }) {
  return (
    <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
      <div className="flex items-start">
        <Info className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-800">Mode lecture seule</h3>
          <p className="mt-1 text-sm text-gray-700">
            {message || 'Vous pouvez consulter les données mais ne pouvez pas les modifier.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FullAccessNotice({ message }: { message?: string }) {
  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
      <div className="flex items-start">
        <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">Accès complet</h3>
          <p className="mt-1 text-sm text-green-700">
            {message || 'Vous disposez de tous les droits sur ce module.'}
          </p>
        </div>
      </div>
    </div>
  );
}
