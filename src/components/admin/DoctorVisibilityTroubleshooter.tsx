import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DoctorVisibility {
  id: string;
  full_name: string;
  specialization: string | null;
  is_accepting_patients: boolean;
  department_name: string | null;
  is_visible: boolean;
}

export function DoctorVisibilityTroubleshooter() {
  const [doctors, setDoctors] = useState<DoctorVisibility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('medical_staff')
        .select(`
          id,
          specialization,
          is_accepting_patients,
          user_profiles!inner(full_name),
          departments(name)
        `)
        .order('id');

      if (data) {
        setDoctors(data.map((d: any) => ({
          id: d.id,
          full_name: d.user_profiles?.full_name || 'Inconnu',
          specialization: d.specialization,
          is_accepting_patients: d.is_accepting_patients ?? false,
          department_name: d.departments?.name || null,
          is_visible: d.is_accepting_patients ?? false,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisibility(doctorId: string, currentState: boolean) {
    try {
      await supabase
        .from('medical_staff')
        .update({ is_accepting_patients: !currentState })
        .eq('id', doctorId);
      fetchDoctors();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  }

  const visibleCount = doctors.filter(d => d.is_visible).length;
  const hiddenCount = doctors.filter(d => !d.is_visible).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total medecins</p>
              <p className="text-xl font-bold">{doctors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Visibles</p>
              <p className="text-xl font-bold text-green-600">{visibleCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Masques</p>
              <p className="text-xl font-bold text-red-600">{hiddenCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Liste des medecins</h3>
          <button
            onClick={fetchDoctors}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : doctors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun medecin enregistre</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{doctor.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {doctor.specialization || 'Generaliste'}
                    {doctor.department_name && ` - ${doctor.department_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {doctor.is_visible ? (
                    <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Visible
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
                      <XCircle className="w-3 h-3" /> Masque
                    </span>
                  )}
                  <button
                    onClick={() => toggleVisibility(doctor.id, doctor.is_visible)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      doctor.is_visible
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {doctor.is_visible ? 'Masquer' : 'Rendre visible'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
