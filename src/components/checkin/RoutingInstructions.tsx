import { useState } from 'react';
import { X, MapPin, User, Clock, Printer, CheckCircle, ArrowRight } from 'lucide-react';
import { Patient } from '../../types/database';

interface RoutingInstructionsProps {
  patient: Patient;
  checkInData: any;
  queueNumber: string;
  isNewPatient: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function RoutingInstructions({
  patient,
  checkInData,
  queueNumber,
  isNewPatient,
  onClose,
  onComplete,
}: RoutingInstructionsProps) {
  const [printing, setPrinting] = useState(false);

  function handlePrintTicket() {
    setPrinting(true);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket de File d'Attente - ${queueNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .ticket {
              border: 2px solid #333;
              padding: 20px;
              text-align: center;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 20px;
            }
            .queue-number {
              font-size: 48px;
              font-weight: bold;
              color: #1e40af;
              margin: 20px 0;
              padding: 20px;
              border: 3px solid #2563eb;
              border-radius: 10px;
            }
            .patient-info {
              margin: 20px 0;
              text-align: left;
            }
            .info-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .label {
              font-weight: bold;
              color: #374151;
            }
            .instructions {
              margin-top: 20px;
              padding: 15px;
              background: #f3f4f6;
              border-radius: 8px;
              text-align: left;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="logo">OKAPIA MÉDICAL</div>
            <div class="queue-number">${queueNumber}</div>

            <div class="patient-info">
              <div class="info-row">
                <span class="label">Patient:</span> ${patient.first_name} ${patient.last_name}
              </div>
              <div class="info-row">
                <span class="label">N° Patient:</span> ${patient.patient_number}
              </div>
              <div class="info-row">
                <span class="label">Date:</span> ${new Date().toLocaleDateString('fr-FR')}
              </div>
              <div class="info-row">
                <span class="label">Heure:</span> ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              ${patient.primary_care_physician?.user_profile?.full_name ? `
              <div class="info-row">
                <span class="label">Médecin:</span> ${patient.primary_care_physician.user_profile.full_name}
              </div>
              ` : ''}
            </div>

            <div class="instructions">
              <strong>Instructions:</strong><br/>
              Veuillez vous rendre en salle d'attente.<br/>
              Votre numéro sera appelé lorsque le médecin sera prêt à vous recevoir.<br/>
              Temps d'attente estimé: 15-20 minutes
            </div>

            <div class="footer">
              Merci de votre patience<br/>
              OKAPIA Médical - Soins de qualité
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    setTimeout(() => setPrinting(false), 1000);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Instructions de Routage</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Enregistrement Réussi</h3>
                <p className="text-sm text-green-700">Patient enregistré avec succès</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-2 text-center">Numéro de File d'Attente</p>
              <p className="text-4xl font-bold text-center text-green-700">{queueNumber}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Instructions pour le Patient
            </h4>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      Se rendre en salle d'attente
                    </p>
                    <p className="text-sm text-gray-600">
                      Veuillez vous diriger vers la salle d'attente principale au rez-de-chaussée.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      Attendre l'appel de votre numéro
                    </p>
                    <p className="text-sm text-gray-600">
                      Votre numéro <span className="font-semibold text-blue-700">{queueNumber}</span> sera affiché sur l'écran et annoncé lorsque le médecin sera prêt.
                    </p>
                  </div>
                </div>
              </div>

              {patient.primary_care_physician?.user_profile && (
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        Médecin assigné
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{patient.primary_care_physician.user_profile.full_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Temps d'attente estimé</p>
                    <p className="text-sm text-gray-600">Environ 15-20 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Informations Patient</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom:</span>
                <span className="font-medium text-gray-900">
                  {patient.first_name} {patient.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">N° Patient:</span>
                <span className="font-medium text-gray-900">{patient.patient_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heure d'enregistrement:</span>
                <span className="font-medium text-gray-900">
                  {new Date(checkInData.checkin_time).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handlePrintTicket}
              disabled={printing}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              <span>{printing ? 'Impression...' : 'Imprimer le Ticket'}</span>
            </button>
            <button
              onClick={onComplete}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>Terminer</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
