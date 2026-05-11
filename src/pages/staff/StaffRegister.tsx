import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, AlertCircle, User, Briefcase, Phone } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

export function StaffRegister() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    roleId: '',
  });
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    try {
      setRolesLoading(true);
      setRolesError('');

      const { data, error: fetchError } = await supabase
        .from('roles')
        .select('id, name, description')
        .order('level', { ascending: false });

      if (fetchError) {
        console.error('Error fetching roles:', fetchError);
        setRolesError('Impossible de charger les rôles. Veuillez rafraîchir la page.');
        return;
      }

      if (data) {
        const availableRoles = data.filter(role => role.name !== 'super_admin');
        console.log('Loaded roles:', availableRoles);
        setRoles(availableRoles);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setRolesError('Erreur lors du chargement des rôles.');
    } finally {
      setRolesLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            role_id: formData.roleId,
            full_name: formData.fullName,
            phone: formData.phone,
            is_active: true,
          });

        if (profileError) throw profileError;

        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Échec de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  const getRoleDisplayName = (roleName: string) => {
    const roleNames: { [key: string]: string } = {
      'hospital_admin': 'Administrateur Hospitalier',
      'doctor': 'Médecin',
      'nurse': 'Infirmier(ère)',
      'pharmacist': 'Pharmacien(ne)',
      'receptionist': 'Réceptionniste',
      'administrative_staff': 'Personnel Administratif',
      'patient': 'Patient(e)',
    };
    return roleNames[roleName] || roleName;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="okapia-logo-wrapper mx-auto mb-4">
              <div className="okapia-logo-container">
                <img
                  src="/Logo-Okapi-Medical.jpg"
                  alt="OKAPIA Médical Logo"
                  className="okapia-logo"
                  style={{ width: '80px', height: '80px' }}
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">OKAPIA Médical</h1>
            <p className="text-gray-600">Inscription du Personnel</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre.email@okapiamedical.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+243 812 345 678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  disabled={rolesLoading || !!rolesError}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {rolesLoading ? 'Chargement des rôles...' : 'Sélectionnez votre rôle'}
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {getRoleDisplayName(role.name)}
                    </option>
                  ))}
                </select>
              </div>
              {rolesError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {rolesError}
                </p>
              )}
              {!rolesLoading && !rolesError && roles.length === 0 && (
                <p className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Aucun rôle disponible pour le moment.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? t.common.loading : "S'inscrire"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {t.auth.have_account}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-white text-sm">
          <p>&copy; {new Date().getFullYear()} OKAPIA Médical. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
