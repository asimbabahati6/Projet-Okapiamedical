import { useState, useEffect } from 'react';
import { Building2, User, Search, Calendar, AlertCircle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Department {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  phone: string;
  email: string;
  is_accepting_patients: boolean;
  average_rating: number;
  total_consultations: number;
}

interface DoctorWithAvailability extends Doctor {
  next_available_date?: string;
  occupancy_rate?: number;
  avatar_url?: string;
}

interface Props {
  selectedDepartmentId?: string;
  selectedDoctorId?: string;
  onDepartmentChange: (departmentId: string | null) => void;
  onDoctorChange: (doctorId: string | null, doctorName?: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function DepartmentDoctorCascadeSelector({
  selectedDepartmentId,
  selectedDoctorId,
  onDepartmentChange,
  onDoctorChange,
  disabled = false,
  required = false
}: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorWithAvailability[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorWithAvailability[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchDoctorsByDepartment(selectedDepartmentId);
    } else {
      setDoctors([]);
      setFilteredDoctors([]);
    }
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doc =>
        doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [searchTerm, doctors]);

  async function fetchDepartments() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Impossible de charger les départements');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDoctorsByDepartment(departmentId: string) {
    setLoadingDoctors(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('doctor_departments')
        .select(`
          doctor_id,
          user_profiles!inner (
            id,
            full_name,
            phone,
            email
          ),
          medical_staff!inner (
            id,
            specialization,
            is_accepting_patients,
            average_rating,
            total_consultations,
            current_status
          )
        `)
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (error) throw error;

      const doctorsData: DoctorWithAvailability[] = (data || []).map((item: any) => {
        const profile = item.user_profiles;
        const staff = item.medical_staff;

        return {
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          email: profile.email,
          specialization: staff.specialization,
          is_accepting_patients: staff.is_accepting_patients,
          average_rating: staff.average_rating || 0,
          total_consultations: staff.total_consultations || 0,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.full_name)}`,
          occupancy_rate: Math.floor(Math.random() * 40) + 50
        };
      });

      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Impossible de charger les médecins');
    } finally {
      setLoadingDoctors(false);
    }
  }

  function handleDepartmentSelect(departmentId: string) {
    if (departmentId === selectedDepartmentId) return;

    onDepartmentChange(departmentId);
    onDoctorChange(null);
    setSearchTerm('');
  }

  function handleDoctorSelect(doctor: DoctorWithAvailability) {
    if (!doctor.is_accepting_patients) return;
    onDoctorChange(doctor.id, doctor.full_name);
  }

  function getDoctorStatusBadge(doctor: DoctorWithAvailability) {
    if (!doctor.is_accepting_patients) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Non disponible</span>;
    }

    const occupancy = doctor.occupancy_rate || 0;
    if (occupancy < 60) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Très disponible</span>;
    } else if (occupancy < 80) {
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">Disponibilités limitées</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Presque complet</span>;
    }
  }

  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          1. Sélectionnez un département {required && <span className="text-red-500">*</span>}
        </label>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((dept) => {
            const isSelected = dept.id === selectedDepartmentId;
            const doctorCount = dept.id === selectedDepartmentId ? doctors.length : 0;

            return (
              <button
                key={dept.id}
                type="button"
                disabled={disabled}
                onClick={() => handleDepartmentSelect(dept.id)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Building2 className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{dept.name}</div>
                    {isSelected && doctorCount > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                        <Users className="w-3 h-3" />
                        <span>{doctorCount} médecin{doctorCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!selectedDepartmentId && (
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4" />
            Veuillez d'abord sélectionner un département pour voir les médecins disponibles
          </p>
        )}
      </div>

      {selectedDepartmentId && (
        <div className="space-y-3 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700">
            2. Sélectionnez un médecin {required && <span className="text-red-500">*</span>}
          </label>

          {loadingDoctors ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Aucun médecin disponible</p>
              <p className="text-sm text-gray-500 mt-1">
                dans le département {selectedDepartment?.name}
              </p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un médecin par nom ou spécialité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {filteredDoctors.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Aucun médecin ne correspond à votre recherche</p>
                  </div>
                ) : (
                  filteredDoctors.map((doctor) => {
                    const isSelected = doctor.id === selectedDoctorId;
                    const canSelect = doctor.is_accepting_patients;

                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        disabled={disabled || !canSelect}
                        onClick={() => handleDoctorSelect(doctor)}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : canSelect
                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                          }
                          ${disabled || !canSelect ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative flex-shrink-0">
                            <img
                              src={doctor.avatar_url}
                              alt={doctor.full_name}
                              className={`w-12 h-12 rounded-full ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                            />
                            {isSelected && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-gray-900">{doctor.full_name}</div>
                                <div className="text-sm text-gray-600">{doctor.specialization}</div>
                              </div>
                              {getDoctorStatusBadge(doctor)}
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{doctor.total_consultations || 0} consultations</span>
                              </div>
                              {doctor.average_rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">★</span>
                                  <span>{doctor.average_rating.toFixed(1)}/5</span>
                                </div>
                              )}
                              {doctor.occupancy_rate && (
                                <div className="flex items-center gap-1">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        doctor.occupancy_rate < 60
                                          ? 'bg-green-500'
                                          : doctor.occupancy_rate < 80
                                          ? 'bg-orange-500'
                                          : 'bg-red-500'
                                      }`}
                                      style={{ width: `${doctor.occupancy_rate}%` }}
                                    />
                                  </div>
                                  <span>{doctor.occupancy_rate}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
