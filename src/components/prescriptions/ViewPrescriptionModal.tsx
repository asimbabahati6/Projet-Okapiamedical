import { Prescription } from '../../types/database';
import { X, FileText, User, Calendar, Package, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { exportToPDF, exportSinglePrescriptionToExcel } from '../../utils/prescriptionExport';
import { formatDoctorName } from '../../utils/formatDoctorName';

interface ViewPrescriptionModalProps {
  prescription: Prescription;
  onClose: () => void;
  onDispense?: (prescriptionId: string) => void;
  onViewPatient?: (patientId: string) => void;
}

export default function ViewPrescriptionModal({ prescription, onClose, onDispense, onViewPatient }: ViewPrescriptionModalProps) {
  const isExpired = new Date(prescription.expiration_date) < new Date();
  const canDispense = onDispense && prescription.status === 'pending' && !isExpired;

  const handleExportExcel = () => {
    exportSinglePrescriptionToExcel(prescription as any);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Détails de la Prescription</h2>
            <p className="text-sm text-gray-600 mt-1">{prescription.prescription_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Prescription Expirée</h3>
                <p className="text-sm text-red-700 mt-1">
                  Cette prescription a expiré le {new Date(prescription.expiration_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations Patient
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-blue-700 font-medium">Nom:</span>
                    <span className="ml-2 text-gray-900">
                      {prescription.patient?.first_name} {prescription.patient?.last_name}
                    </span>
                  </div>
                  {onViewPatient && (
                    <button
                      onClick={() => onViewPatient(prescription.patient_id)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Voir le profil du patient"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <span className="text-blue-700 font-medium">N° Patient:</span>
                  <span className="ml-2 text-gray-900">{prescription.patient?.patient_number}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Date de naissance:</span>
                  <span className="ml-2 text-gray-900">
                    {prescription.patient?.date_of_birth ?
                      new Date(prescription.patient.date_of_birth).toLocaleDateString('fr-FR') :
                      'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Téléphone:</span>
                  <span className="ml-2 text-gray-900">{prescription.patient?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informations Prescription
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Date:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(prescription.prescription_date || prescription.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Valide jusqu'au:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(prescription.expiration_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Médecin:</span>
                  <span className="ml-2 text-gray-900">{formatDoctorName(prescription.doctor?.full_name)}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Pharmacie:</span>
                  <span className="ml-2 text-gray-900">{prescription.pharmacy?.name || 'Non assignée'}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Statut:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                    prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                    prescription.status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {prescription.status === 'pending' ? 'En attente' :
                     prescription.status === 'dispensed' ? 'Dispensé' :
                     prescription.status === 'expired' ? 'Expiré' :
                     'Annulé'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {prescription.diagnosis && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Diagnostic</h3>
              <p className="text-gray-900">{prescription.diagnosis}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Médicaments Prescrits
            </h3>
            <div className="space-y-4">
              {prescription.items?.map((item, index) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {index + 1}. {item.medication?.brand_name || item.medication?.generic_name}
                      </h4>
                      <p className="text-sm text-gray-600">{item.medication?.strength}</p>
                    </div>
                    {!item.stock_available && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                        Stock faible
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Dosage</p>
                      <p className="font-medium text-gray-900">{item.dosage}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Fréquence</p>
                      <p className="font-medium text-gray-900">{item.frequency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Durée</p>
                      <p className="font-medium text-gray-900">{item.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Quantité</p>
                      <p className="font-medium text-gray-900">{item.quantity}</p>
                    </div>
                  </div>

                  {item.instructions && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm font-medium text-yellow-900 mb-1">Instructions:</p>
                      <p className="text-sm text-yellow-800">{item.instructions}</p>
                    </div>
                  )}

                  {item.substitution_allowed && (
                    <div className="mt-2 text-xs text-gray-600 italic">
                      Substitution générique autorisée
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {prescription.notes && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-2">Notes du Médecin</h3>
              <p className="text-gray-900">{prescription.notes}</p>
            </div>
          )}

          {prescription.status === 'dispensed' && prescription.dispensed_at && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Informations de Dispensation</h3>
              <p className="text-sm text-green-800">
                Dispensé le {new Date(prescription.dispensed_at).toLocaleDateString('fr-FR')} à{' '}
                {new Date(prescription.dispensed_at).toLocaleTimeString('fr-FR')}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Exporter en Excel"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => exportToPDF(prescription as any)}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          {canDispense && (
            <button
              onClick={() => onDispense!(prescription.id)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Marquer comme Dispensé
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
