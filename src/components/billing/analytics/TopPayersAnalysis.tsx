import { useState } from 'react';
import { DollarSign, Activity, TrendingUp, Phone, Mail, Award, ChevronRight } from 'lucide-react';
import { TopPayer } from '../../../types/billingAnalytics';
import { formatCurrency, formatNumber } from '../../../utils/billingCalculations';

interface TopPayersAnalysisProps {
  byAmount: TopPayer[];
  byFrequency: TopPayer[];
  onPatientClick?: (patientId: string) => void;
}

type ViewMode = 'amount' | 'frequency';

export function TopPayersAnalysis({ byAmount, byFrequency, onPatientClick }: TopPayersAnalysisProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('amount');

  const currentData = viewMode === 'amount' ? byAmount : byFrequency;

  const getPodiumColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
      case 1:
        return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white';
      case 2:
        return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  const getPodiumIcon = (index: number) => {
    const icons = ['🥇', '🥈', '🥉'];
    return icons[index] || `#${index + 1}`;
  };

  const topThree = currentData.slice(0, 3);
  const remaining = currentData.slice(3, 10);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Top Patients</h3>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('amount')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'amount'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Par Montant
          </button>
          <button
            onClick={() => setViewMode('frequency')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'frequency'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Par Fréquence
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((payer, index) => (
            <div
              key={payer.patientId}
              className={`${getPodiumColor(index)} rounded-xl p-6 cursor-pointer transform hover:scale-105 transition-transform relative overflow-hidden`}
              onClick={() => onPatientClick?.(payer.patientId)}
            >
              <div className="absolute top-2 right-2 text-4xl opacity-20">
                {getPodiumIcon(index)}
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="text-sm font-bold">
                    {index === 0 ? '1ère' : index === 1 ? '2ème' : '3ème'} Place
                  </span>
                </div>

                <h4 className="text-lg font-bold mb-1">{payer.patientName}</h4>
                <p className="text-sm opacity-90 mb-4">{payer.patientNumber}</p>

                <div className="space-y-2">
                  {viewMode === 'amount' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-90">Total payé:</span>
                        <span className="text-lg font-bold">{formatCurrency(payer.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-90">Paiements:</span>
                        <span className="font-medium">{payer.paymentCount}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-90">Paiements:</span>
                        <span className="text-lg font-bold">{payer.paymentCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-90">Total:</span>
                        <span className="font-medium">{formatCurrency(payer.totalAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Moyenne:</span>
                    <span className="font-medium">{formatCurrency(payer.averagePayment)}</span>
                  </div>
                </div>

                <div className={`mt-3 pt-3 border-t ${index === 0 ? 'border-yellow-500' : index === 1 ? 'border-gray-400' : 'border-orange-500'}`}>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    payer.status === 'active'
                      ? 'bg-white bg-opacity-20'
                      : 'bg-black bg-opacity-20'
                  }`}>
                    {payer.status === 'active' ? '● Actif' : '○ Inactif'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {remaining.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Classement Complet</h4>
          <div className="space-y-2">
            {remaining.map((payer, index) => (
              <div
                key={payer.patientId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => onPatientClick?.(payer.patientId)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-sm text-gray-700">
                    {index + 4}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{payer.patientName}</p>
                    <p className="text-xs text-gray-500">{payer.patientNumber}</p>
                  </div>

                  <div className="text-right">
                    {viewMode === 'amount' ? (
                      <>
                        <p className="font-bold text-gray-900">{formatCurrency(payer.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{payer.paymentCount} paiements</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-gray-900">{payer.paymentCount} paiements</p>
                        <p className="text-xs text-gray-500">{formatCurrency(payer.totalAmount)}</p>
                      </>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentData.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune donnée de paiement disponible</p>
        </div>
      )}
    </div>
  );
}
