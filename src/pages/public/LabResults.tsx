import { useState } from 'react';
import {
  FlaskConical, Lock, Search, Printer, AlertTriangle,
  ShieldCheck, Clock, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LabTestResult {
  test_name: string;
  category: string | null;
  result_value: string | null;
  result_unit: string | null;
  normal_range: string | null;
  is_abnormal: boolean;
  approved_at: string | null;
}

interface LookupResponse {
  status: 'success' | 'error';
  code?: string;
  patient?: {
    first_name: string;
    last_name: string;
    patient_number: string;
    date_of_birth: string;
  };
  order?: {
    order_number: string;
    created_at: string;
    status: string;
  };
  results?: LabTestResult[];
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: 'Veuillez renseigner votre numéro de dossier et votre code d\'accès.',
  invalid_credentials:
    'Numéro de dossier ou code d\'accès incorrect. Vérifiez les informations remises par le laboratoire.',
  too_many_attempts:
    'Trop de tentatives. Par mesure de sécurité, l\'accès est temporairement bloqué. Réessayez dans 15 minutes ou contactez le laboratoire.',
  default: 'Une erreur est survenue. Veuillez réessayer ou contacter le laboratoire.',
};

export function LabResults() {
  const [patientNumber, setPatientNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<LookupResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: response, error: rpcError } = await supabase.rpc('lookup_lab_results', {
        p_patient_number: patientNumber,
        p_access_code: accessCode,
      });

      if (rpcError) throw rpcError;

      const result = response as LookupResponse;
      if (result.status === 'success') {
        setData(result);
      } else {
        setError(ERROR_MESSAGES[result.code || 'default'] || ERROR_MESSAGES.default);
      }
    } catch (err) {
      console.error('Lab results lookup error:', err);
      setError(ERROR_MESSAGES.default);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setData(null);
    setPatientNumber('');
    setAccessCode('');
    setError('');
  }

  // ===== Vue résultats =====
  if (data?.status === 'success' && data.patient && data.order) {
    const results = data.results || [];
    const hasAbnormal = results.some((r) => r.is_abnormal);

    return (
      <div className="min-h-screen bg-sand py-10 print:bg-white print:py-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors mb-6 print:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            Nouvelle recherche
          </button>

          <div className="card overflow-hidden">
            {/* En-tête du compte-rendu */}
            <div className="bg-ink text-white px-8 py-6 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow--light mb-2">Compte-rendu d'analyses</p>
                <h1 className="font-display text-xl font-semibold">OKAPIA Medical — Laboratoire</h1>
              </div>
              <FlaskConical className="w-8 h-8 text-brand-300 shrink-0" />
            </div>

            {/* Identité + demande */}
            <div className="px-8 py-6 border-b border-line grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1">Patient</p>
                <p className="font-medium text-ink">
                  {data.patient.first_name} {data.patient.last_name}
                </p>
                <p className="text-ink-muted">Dossier {data.patient.patient_number}</p>
                <p className="text-ink-muted">
                  Né(e) le {new Date(data.patient.date_of_birth).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1">Demande</p>
                <p className="font-medium text-ink">N° {data.order.order_number}</p>
                <p className="text-ink-muted">
                  Prélèvement du {new Date(data.order.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Résultats */}
            <div className="px-8 py-6">
              {results.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-10 h-10 text-ink-muted/60 mx-auto mb-4" />
                  <h2 className="font-display font-semibold text-ink mb-2">Résultats en cours de validation</h2>
                  <p className="text-sm text-ink-muted max-w-sm mx-auto">
                    Vos analyses sont en cours de traitement ou de validation par notre équipe.
                    Revenez consulter cette page ultérieurement.
                  </p>
                </div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-line">
                        <th className="font-mono text-[10px] uppercase tracking-widest text-ink-muted font-medium pb-3">Analyse</th>
                        <th className="font-mono text-[10px] uppercase tracking-widest text-ink-muted font-medium pb-3">Résultat</th>
                        <th className="font-mono text-[10px] uppercase tracking-widest text-ink-muted font-medium pb-3 hidden sm:table-cell">Valeurs de référence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {results.map((r, i) => (
                        <tr key={i}>
                          <td className="py-3.5 pr-4">
                            <p className="font-medium text-ink">{r.test_name}</p>
                            {r.category && <p className="text-xs text-ink-muted">{r.category}</p>}
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className={`inline-flex items-center gap-1.5 font-semibold ${r.is_abnormal ? 'text-red-600' : 'text-ink'}`}>
                              {r.result_value} {r.result_unit}
                              {r.is_abnormal && <AlertTriangle className="w-3.5 h-3.5" />}
                            </span>
                          </td>
                          <td className="py-3.5 text-ink-muted hidden sm:table-cell">{r.normal_range || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {hasAbnormal && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-sm text-red-800">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>
                        Certains résultats sont en dehors des valeurs de référence. Un résultat
                        anormal ne constitue pas un diagnostic : consultez votre médecin pour
                        l'interprétation de ces analyses.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                    <button onClick={() => window.print()} className="btn-primary !py-2.5 !px-5 text-sm">
                      <Printer className="w-4 h-4" />
                      Imprimer / Enregistrer en PDF
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Pied de page conformité */}
            <div className="px-8 py-4 bg-sand border-t border-line text-xs text-ink-muted flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" />
              <p>
                Document confidentiel destiné exclusivement au patient. Cet accès a été enregistré
                dans notre journal de sécurité. Pour toute question, contactez le laboratoire au
                +243 823 800 104.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Vue formulaire =====
  return (
    <div className="min-h-screen bg-sand">
      {/* Bannière */}
      <div className="relative bg-ink text-white py-16 overflow-hidden">
        <div className="okapi-stripes absolute top-0 right-0 h-full w-24 text-white opacity-[0.05] pointer-events-none" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <p className="eyebrow eyebrow--light mb-4">Portail laboratoire</p>
          <h1 className="font-display font-semibold" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            Consultez vos résultats d'analyses
          </h1>
          <p className="text-lg text-white/75 max-w-2xl mt-4">
            Accédez à vos résultats en toute sécurité avec les identifiants remis par notre laboratoire.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Formulaire */}
          <div className="lg:col-span-3 card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand-50 w-11 h-11 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-brand-600" />
              </div>
              <h2 className="font-display text-xl font-semibold text-ink">Accès sécurisé</h2>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800 flex gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="patient-number" className="block text-sm font-medium text-ink mb-2">
                  Numéro de dossier patient
                </label>
                <input
                  id="patient-number"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Ex. PAT-2026-00123"
                  value={patientNumber}
                  onChange={(e) => setPatientNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label htmlFor="access-code" className="block text-sm font-medium text-ink mb-2">
                  Code d'accès
                </label>
                <input
                  id="access-code"
                  type="password"
                  required
                  autoComplete="off"
                  placeholder="Code remis par le laboratoire"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono tracking-widest"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 disabled:opacity-50">
                <Search className="w-5 h-5" />
                {loading ? 'Vérification...' : 'Consulter mes résultats'}
              </button>
            </form>
          </div>

          {/* Informations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <h3 className="font-display font-semibold text-ink mb-4">Comment ça marche ?</h3>
              <ol className="space-y-3 text-sm text-ink-muted">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>Votre numéro de dossier figure sur votre reçu ou votre carte patient.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>Le code d'accès vous est remis par le laboratoire lors du prélèvement.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>Seuls les résultats validés par notre équipe médicale sont affichés.</span>
                </li>
              </ol>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <h3 className="font-display font-semibold text-ink text-sm">Vos données sont protégées</h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Connexion chiffrée, codes d'accès à usage personnel avec expiration automatique,
                et journalisation de chaque consultation. Vos résultats ne sont jamais transmis
                à des tiers. Le code est strictement confidentiel : ne le partagez pas.
              </p>
            </div>

            <div className="card p-6 bg-ink border-ink">
              <p className="text-xs text-white/70 leading-relaxed">
                <span className="text-brand-300 font-medium">Besoin d'aide ?</span> Code perdu ou
                expiré, résultat introuvable : contactez le laboratoire au{' '}
                <span className="text-white font-medium">+243 823 800 104</span> (Lun–Ven, 08h–17h).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
