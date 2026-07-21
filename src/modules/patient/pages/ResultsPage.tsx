import React, { useState, useEffect } from 'react';
import { FlaskConical, AlertTriangle, Clock, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface LabTestResult {
  test_name: string;
  category: string | null;
  result_value: string | null;
  result_unit: string | null;
  normal_range: string | null;
  is_abnormal: boolean;
  approved_at: string | null;
}

interface LabOrder {
  order_number: string;
  created_at: string;
  status: string;
  results: LabTestResult[];
}

export const ResultsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [openOrder, setOpenOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    try {
      const { data, error } = await supabase.rpc('get_my_lab_results');
      if (error) throw error;

      if (data?.status === 'success') {
        const list: LabOrder[] = data.orders || [];
        setOrders(list);
        if (list.length > 0) setOpenOrder(list[0].order_number);
      } else {
        setErrorCode(data?.code || 'unknown');
      }
    } catch (err) {
      console.error('Error fetching lab results:', err);
      setErrorCode('unknown');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Mes Résultats</h1>
        <p className="text-ink-muted mt-1">Consultez vos résultats d'analyses validés par notre laboratoire</p>
      </div>

      {errorCode === 'no_patient_record' ? (
        <div className="card p-10 text-center">
          <FlaskConical className="w-12 h-12 text-ink-muted/50 mx-auto mb-4" />
          <h2 className="font-display font-semibold text-ink mb-2">Aucun dossier patient associé</h2>
          <p className="text-sm text-ink-muted max-w-md mx-auto">
            Aucun dossier patient ne correspond à l'adresse email de votre compte. Rapprochez-vous
            de la réception pour associer votre dossier, ou utilisez le portail public avec le
            code remis par le laboratoire.
          </p>
        </div>
      ) : errorCode ? (
        <div className="card p-10 text-center">
          <AlertTriangle className="w-12 h-12 text-ink-muted/50 mx-auto mb-4" />
          <h2 className="font-display font-semibold text-ink mb-2">Impossible de charger vos résultats</h2>
          <p className="text-sm text-ink-muted">Veuillez réessayer plus tard ou contacter le laboratoire.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <FlaskConical className="w-12 h-12 text-ink-muted/50 mx-auto mb-4" />
          <h2 className="font-display font-semibold text-ink mb-2">Aucune analyse pour le moment</h2>
          <p className="text-sm text-ink-muted">
            Vos futures analyses réalisées dans notre laboratoire apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isOpen = openOrder === order.order_number;
            const validated = order.results.length > 0;
            const hasAbnormal = order.results.some((r) => r.is_abnormal);

            return (
              <div key={order.order_number} className="card overflow-hidden">
                <button
                  onClick={() => setOpenOrder(isOpen ? null : order.order_number)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-sand transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${validated ? 'bg-brand-50' : 'bg-sand-dark'}`}>
                      {validated
                        ? <FlaskConical className="w-5 h-5 text-brand-600" />
                        : <Clock className="w-5 h-5 text-ink-muted" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">Demande N° {order.order_number}</p>
                      <p className="text-xs text-ink-muted">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}
                        {validated ? `${order.results.length} résultat(s) validé(s)` : 'En cours de validation'}
                        {hasAbnormal && <span className="text-red-600 font-medium"> · valeurs hors normes</span>}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-ink-muted shrink-0" /> : <ChevronDown className="w-5 h-5 text-ink-muted shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-line px-6 py-5">
                    {!validated ? (
                      <p className="text-sm text-ink-muted text-center py-4">
                        Ces analyses sont en cours de traitement ou de validation par notre équipe médicale.
                      </p>
                    ) : (
                      <>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left border-b border-line">
                              <th className="font-mono text-[10px] uppercase tracking-widest text-ink-muted font-medium pb-3">Analyse</th>
                              <th className="font-mono text-[10px] uppercase tracking-widest text-ink-muted font-medium pb-3">Résultat</th>
                              <th className="font-mono text-[10px] uppercase tracking-widest text-ink-muted font-medium pb-3 hidden sm:table-cell">Référence</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {order.results.map((r, i) => (
                              <tr key={i}>
                                <td className="py-3 pr-4">
                                  <p className="font-medium text-ink">{r.test_name}</p>
                                  {r.category && <p className="text-xs text-ink-muted">{r.category}</p>}
                                </td>
                                <td className="py-3 pr-4">
                                  <span className={`inline-flex items-center gap-1.5 font-semibold ${r.is_abnormal ? 'text-red-600' : 'text-ink'}`}>
                                    {r.result_value} {r.result_unit}
                                    {r.is_abnormal && <AlertTriangle className="w-3.5 h-3.5" />}
                                  </span>
                                </td>
                                <td className="py-3 text-ink-muted hidden sm:table-cell">{r.normal_range || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {hasAbnormal && (
                          <div className="mt-4 p-3.5 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-xs text-red-800">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>
                              Certains résultats sont hors des valeurs de référence. Un résultat anormal
                              ne constitue pas un diagnostic : parlez-en à votre médecin.
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => window.print()}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors print:hidden"
                        >
                          <Printer className="w-4 h-4" />
                          Imprimer cette demande
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
