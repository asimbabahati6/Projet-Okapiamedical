import { X, Phone, Mail, MapPin, Calendar, Briefcase } from 'lucide-react';
import { Employee } from '../../types/drcClinic';

interface EmployeeDetailsModalProps {
  employee: Employee;
  onClose: () => void;
  onUpdate: () => void;
}

export function EmployeeDetailsModal({ employee, onClose }: EmployeeDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Détails de l'Employé</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            {employee.photo_url ? (
              <img
                src={employee.photo_url}
                alt={`${employee.first_name} ${employee.last_name}`}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-semibold text-blue-600">
                  {employee.first_name[0]}{employee.last_name[0]}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-gray-600">{employee.position}</p>
              <p className="text-sm text-gray-500">Matricule: {employee.employee_number}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Informations de Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium text-gray-900">{employee.phone}</p>
                </div>
              </div>
              {employee.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{employee.email}</p>
                  </div>
                </div>
              )}
              {employee.address && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="font-medium text-gray-900">{employee.address}, {employee.city}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employment Information */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <h4 className="font-semibold text-gray-900">Informations d'Emploi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Département</p>
                  <p className="font-medium text-gray-900">{employee.department || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Date d'Embauche</p>
                  <p className="font-medium text-gray-900">
                    {new Date(employee.hire_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Staff Info */}
          {employee.is_medical_staff && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              <h4 className="font-semibold text-gray-900">Information Médicale</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.medical_specialty && (
                  <div>
                    <p className="text-sm text-gray-600">Spécialité</p>
                    <p className="font-medium text-gray-900">{employee.medical_specialty}</p>
                  </div>
                )}
                {employee.professional_registration_number && (
                  <div>
                    <p className="text-sm text-gray-600">Numéro d'Inscription</p>
                    <p className="font-medium text-gray-900">{employee.professional_registration_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
