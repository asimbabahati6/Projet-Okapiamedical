import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Home, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { AccessDenied } from '../../components/AccessDenied';
import { supabase } from '../../lib/supabase';

export function StaffLogin() {
  const navigate = useNavigate();
  const { signIn, user, profile, isPatient, canAccessBackend, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    if (!authLoading && user && profile) {
      if (canAccessBackend()) {
        navigate('/tableau-de-bord');
      }
    }
  }, [authLoading, user, profile, canAccessBackend, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(t.auth.sign_in_error);
      setLoading(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/admin`,
      });

      if (error) throw error;

      setResetSuccess(true);
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail('');
        setResetSuccess(false);
      }, 3000);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  }

  function openResetModal() {
    setShowResetModal(true);
    setResetEmail(email);
    setResetError('');
    setResetSuccess(false);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (user && profile && isPatient()) {
    return (
      <AccessDenied
        message="Accès réservé au personnel"
        description="Cette page de connexion est réservée au personnel médical et administratif. En tant que patient, vous êtes déjà connecté et pouvez accéder à votre espace patient depuis la page d'accueil."
        showHomeButton={true}
        showBackButton={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-blue-200 transition-colors inline-flex items-center gap-2 text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            {t.common.back_to_home}
          </button>
        </div>
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
            <p className="text-gray-600">Portail du Personnel</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@hospital.com"
                />
              </div>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {loading ? t.common.loading : t.auth.sign_in}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              type="button"
              onClick={openResetModal}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {t.auth.forgot_password}
            </button>
            <div>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {t.auth.no_account}
              </button>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/admin-setup')}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Restaurer l'accès administrateur
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-white text-sm">
          <p>&copy; {new Date().getFullYear()} OKAPIA Médical. Tous droits réservés.</p>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Réinitialiser le mot de passe</h2>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Email de réinitialisation envoyé!</p>
                <p className="text-sm text-gray-600">
                  Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>

                {resetError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{resetError}</p>
                  </div>
                )}

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your.email@hospital.com"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {resetLoading ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
