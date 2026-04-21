import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  CheckCheck,
  LogIn,
  User,
  Key,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminAccount {
  email: string;
  full_name: string;
  role: string;
  temporary_password: string;
}

type SetupState = 'idle' | 'running' | 'done' | 'already_initialized' | 'error';

export default function AdminSetupPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<SetupState>('idle');
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  async function runSetup() {
    setState('running');
    setErrorMsg('');

    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-accounts`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await res.json();

      if (res.status === 409 || json.already_initialized) {
        setState('already_initialized');
        return;
      }

      if (!json.success) {
        throw new Error(json.error || 'Unknown error from edge function');
      }

      setAccounts(json.accounts ?? []);
      setState('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000);
    });
  }

  function toggleVisible(key: string) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/40">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Restauration d'accès</h1>
          <p className="text-slate-400 text-sm">
            OKAPIA Médical — Configuration des comptes administrateurs
          </p>
        </div>

        {/* Idle state */}
        {state === 'idle' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-semibold text-sm mb-1">
                  Action à effectuer une seule fois
                </p>
                <p className="text-amber-200/70 text-sm">
                  Cette procédure crée les deux comptes administrateurs principaux et génère leurs
                  mots de passe temporaires. Elle ne peut pas être relancée si des comptes existent
                  déjà.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <AccountPreviewRow
                email="nsibazebosso@gmail.com"
                name="Gold Nsibaze Bosso"
                role="Super Administrateur"
              />
              <AccountPreviewRow
                email="jabazeboso@gmail.com"
                name="Médecin Directeur Bazeboso"
                role="Super Administrateur / Médecin Directeur"
              />
            </div>

            <button
              onClick={runSetup}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <ShieldCheck className="w-5 h-5" />
              Créer les comptes administrateurs
            </button>
          </div>
        )}

        {/* Running */}
        {state === 'running' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-sm text-center">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold text-lg mb-1">Création des comptes en cours...</p>
            <p className="text-slate-400 text-sm">Veuillez patienter</p>
          </div>
        )}

        {/* Already initialized */}
        {state === 'already_initialized' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 border border-green-500/30 rounded-2xl mb-4">
              <CheckCheck className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Système déjà initialisé</h2>
            <p className="text-slate-400 text-sm mb-8">
              Des comptes utilisateurs existent déjà dans le système. Aucune action n'est
              nécessaire.
            </p>
            <button
              onClick={() => navigate('/staff/login')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Aller à la connexion
            </button>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-semibold text-sm mb-1">Erreur lors de la création</p>
                <p className="text-red-200/70 text-sm font-mono break-all">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={() => setState('idle')}
              className="w-full border border-white/20 hover:border-white/40 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        )}

        {/* Done — show credentials */}
        {state === 'done' && accounts.length > 0 && (
          <div className="space-y-4">
            {/* Warning banner */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-semibold text-sm">
                  Sauvegardez ces identifiants maintenant
                </p>
                <p className="text-amber-200/70 text-xs mt-0.5">
                  Ces mots de passe ne seront plus affichés. Vous devrez les changer lors de la
                  première connexion.
                </p>
              </div>
            </div>

            {/* Credential cards */}
            {accounts.map((acc, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{acc.full_name}</p>
                    <p className="text-slate-400 text-xs">{acc.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <CredentialRow
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    value={acc.email}
                    copyKey={`email-${i}`}
                    copied={copied[`email-${i}`]}
                    onCopy={() => copyToClipboard(acc.email, `email-${i}`)}
                    isPassword={false}
                    isVisible={true}
                  />
                  <CredentialRow
                    icon={<Key className="w-4 h-4" />}
                    label="Mot de passe temporaire"
                    value={acc.temporary_password}
                    copyKey={`pwd-${i}`}
                    copied={copied[`pwd-${i}`]}
                    onCopy={() => copyToClipboard(acc.temporary_password, `pwd-${i}`)}
                    isPassword={true}
                    isVisible={!!visible[`pwd-${i}`]}
                    onToggleVisible={() => toggleVisible(`pwd-${i}`)}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate('/staff/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <LogIn className="w-5 h-5" />
              Aller à la connexion
            </button>

            <p className="text-center text-slate-500 text-xs">
              Vous serez invité à changer votre mot de passe lors de la première connexion.
            </p>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-8">
          &copy; {new Date().getFullYear()} OKAPIA Médical. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

function AccountPreviewRow({
  email,
  name,
  role,
}: {
  email: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-slate-300" />
      </div>
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">{name}</p>
        <p className="text-slate-400 text-xs truncate">{email}</p>
      </div>
      <span className="ml-auto text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
        {role}
      </span>
    </div>
  );
}

function CredentialRow({
  icon,
  label,
  value,
  copyKey,
  copied,
  onCopy,
  isPassword,
  isVisible,
  onToggleVisible,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copyKey: string;
  copied: boolean;
  onCopy: () => void;
  isPassword: boolean;
  isVisible: boolean;
  onToggleVisible?: () => void;
}) {
  const display = isPassword && !isVisible ? '•'.repeat(Math.min(value.length, 16)) : value;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/5">
      <span className="text-slate-400 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-slate-500 text-xs mb-0.5">{label}</p>
        <p className="text-white text-sm font-mono truncate">{display}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isPassword && onToggleVisible && (
          <button
            onClick={onToggleVisible}
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            title={isVisible ? 'Masquer' : 'Afficher'}
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button
          onClick={onCopy}
          className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          title="Copier"
        >
          {copied ? (
            <CheckCheck className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
