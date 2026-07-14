import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  selectedDepartmentId: string;
  selectedDoctorId: string;
  onDepartmentChange: (id: string) => void;
  onDoctorChange: (id: string, name: string) => void;
}

export default function DepartmentDoctorCascadeSelector({
  selectedDepartmentId,
  selectedDoctorId,
  onDepartmentChange,
  onDoctorChange,
}: Props) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('departments').select('id, name').order('name').then(({ data }) => {
      if (data) setDepartments(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedDepartmentId) { setDoctors([]); return; }
    supabase
      .from('doctor_departments')
      .select('doctor_id, user_profiles!doctor_departments_doctor_id_fkey(id, first_name, last_name)')
      .eq('department_id', selectedDepartmentId)
      .then(({ data }) => {
        if (data) {
          setDoctors(data.map((d: any) => d.user_profiles).filter(Boolean));
        }
      });
  }, [selectedDepartmentId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Departement</label>
        <select
          value={selectedDepartmentId}
          onChange={e => { onDepartmentChange(e.target.value); onDoctorChange('', ''); }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Choisir --</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Medecin</label>
        <select
          value={selectedDoctorId}
          onChange={e => {
            const doc = doctors.find(d => d.id === e.target.value);
            onDoctorChange(e.target.value, doc ? `${doc.first_name || ''} ${doc.last_name || ''}`.trim() : '');
          }}
          disabled={!selectedDepartmentId}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        >
          <option value="">-- Choisir --</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
        </select>
      </div>
    </div>
  );
}
