import { useState, useEffect } from 'react';
import { User, Stethoscope } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { MedicalStaff, Department } from '../../types/database';
import { formatDoctorName } from '../../utils/formatDoctorName';

export function Doctors() {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState<(MedicalStaff & { user_profile?: any; department?: Department })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []);

  async function fetchDepartments() {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('name');

    if (data) setDepartments(data);
  }

  async function fetchDoctors() {
    try {
      const { data, error } = await supabase
        .from('medical_staff')
        .select(`
          *,
          user_profile:user_profiles(
            id,
            full_name,
            phone,
            avatar_url,
            department_id,
            department:departments(id, name, is_public)
          )
        `)
        .eq('is_accepting_patients', true);

      if (error) throw error;

      // Filter out doctors from private departments
      const publicDoctors = (data || []).filter(doctor => {
        // Keep if no department assigned or if department is public
        return !doctor.user_profile?.department ||
               doctor.user_profile.department.is_public !== false;
      });

      setDoctors(publicDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredDoctors = doctors.filter(doctor => {
    if (selectedDepartment === 'all') return true;
    return doctor.user_profile?.department?.id === selectedDepartment;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.doctors.title}</h1>
          <p className="text-lg text-gray-600">Rencontrez nos professionnels de santé expérimentés</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedDepartment === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tous les départements
            </button>
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedDepartment === dept.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun médecin trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {doctor.user_profile?.avatar_url ? (
                        <img
                          src={doctor.user_profile.avatar_url}
                          alt={doctor.user_profile?.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDoctorName(doctor.user_profile?.full_name)}
                      </h3>
                      {doctor.user_profile?.department && (
                        <p className="text-sm text-gray-600">{doctor.user_profile.department.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {doctor.specialization && (
                      <div className="flex items-start gap-2">
                        <Stethoscope className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{t.doctors.specialization}</p>
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        </div>
                      </div>
                    )}

                    {doctor.years_of_experience > 0 && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">
                          {doctor.years_of_experience} {t.doctors.experience}
                        </p>
                      </div>
                    )}

                    {doctor.consultation_fee && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">{t.doctors.consultation_fee}:</p>
                        <p className="text-sm text-gray-600">${doctor.consultation_fee}</p>
                      </div>
                    )}
                  </div>

                  {doctor.bio && (
                    <p className="text-sm text-gray-600 mb-6 line-clamp-3">{doctor.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
