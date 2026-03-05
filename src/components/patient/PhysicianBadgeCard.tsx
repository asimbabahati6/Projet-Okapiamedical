import { useState } from 'react';
import { Stethoscope, ExternalLink, X, Mail, Phone, Copy, Building2, CheckCircle, Edit } from 'lucide-react';

interface PhysicianInfo {
  id: string;
  name: string;
  specialization: string | null;
  rpps_number: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
}

interface PhysicianBadgeCardProps {
  physician: PhysicianInfo | null;
  onChangePhysician?: () => void;
  compact?: boolean;
}

export default function PhysicianBadgeCard({
  physician,
  onChangePhysician,
  compact = false
}: PhysicianBadgeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedRPPS, setCopiedRPPS] = useState(false);

  if (!physician) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <Stethoscope className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">Aucun médecin référent assigné</span>
        {onChangePhysician && (
          <button
            onClick={onChangePhysician}
            className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Assigner
          </button>
        )}
      </div>
    );
  }

  const handleCopyRPPS = async () => {
    if (physician.rpps_number) {
      await navigator.clipboard.writeText(physician.rpps_number);
      setCopiedRPPS(true);
      setTimeout(() => setCopiedRPPS(false), 2000);
    }
  };

  const handleCallPhone = () => {
    if (physician.phone) {
      window.location.href = `tel:${physician.phone}`;
    }
  };

  const handleSendEmail = () => {
    if (physician.email) {
      window.location.href = `mailto:${physician.email}`;
    }
  };

  return (
    <div className="relative">
      <div
        onClick={() => setShowDetails(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-900">
              Dr. {physician.name}
            </span>
            {!compact && physician.specialization && (
              <span className="text-xs text-blue-700">- {physician.specialization}</span>
            )}
          </div>
          {compact && physician.specialization && (
            <div className="text-xs text-blue-700">{physician.specialization}</div>
          )}
        </div>
        <ExternalLink className="w-3 h-3 text-blue-500 group-hover:scale-110 transition-transform" />
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Médecin Référent</h3>
                  <p className="text-sm text-blue-100">Informations de contact</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {physician.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">Dr. {physician.name}</h4>
                  {physician.specialization && (
                    <p className="text-sm text-gray-600">{physician.specialization}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {physician.rpps_number && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Numéro RPPS</p>
                      <p className="text-sm font-mono font-semibold text-gray-900">{physician.rpps_number}</p>
                    </div>
                    <button
                      onClick={handleCopyRPPS}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Copier le numéro RPPS"
                    >
                      {copiedRPPS ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                )}

                {physician.email && (
                  <button
                    onClick={handleSendEmail}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left group"
                  >
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 font-medium">Email</p>
                      <p className="text-sm text-gray-900 truncate">{physician.email}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </button>
                )}

                {physician.phone && (
                  <button
                    onClick={handleCallPhone}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left group"
                  >
                    <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium">Téléphone</p>
                      <p className="text-sm text-gray-900">{physician.phone}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </button>
                )}

                {physician.department && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium">Département</p>
                      <p className="text-sm text-gray-900">{physician.department}</p>
                    </div>
                  </div>
                )}
              </div>

              {onChangePhysician && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      onChangePhysician();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Changer de médecin référent
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
