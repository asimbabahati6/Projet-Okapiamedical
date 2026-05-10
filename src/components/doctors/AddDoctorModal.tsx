import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDoctorModal({ isOpen, onClose, onSuccess }: AddDoctorModalProps) {
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) fetchDepartments();
  }, [isOpen]);

  async function fetchDepartments() {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (data) setDepartments(data);
  }

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setSaving(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('medical_staff').insert({
        specialization: specialization || null,
        is_accepting_patients: true,
        department_id: departmentId || null,
      });

      if (insertError) throw insertError;
      onSuccess();
      onClose();
      setFullName('');
      setSpecialization('');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la creation');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Ajouter un medecin
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialite</label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departement</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Selectionner --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving || !fullName.trim()} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creation...' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
