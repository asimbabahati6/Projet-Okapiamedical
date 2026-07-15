import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, ArrowRight, Loader2, Info, ArrowRightLeft } from 'lucide-react';
import type * as XLSXType from 'xlsx';
import { supabase } from '../../lib/supabase';
import { logActivity } from '../../utils/activityLogger';

interface MedicalAct {
  id: string;
  act_name: string;
  category: string;
  price_usd: number;
  price_cdf: number;
  is_active: boolean;
}

interface ParsedRow {
  rowIndex: number;
  categorie: string;
  acte: string;
  prix_usd: number;
}

interface ErrorRow {
  rowIndex: number;
  reason: string;
  raw: Record<string, unknown>;
}

interface MatchedUpdate {
  existingId: string;
  acte: string;
  categorie: string;
  oldPrice: number;
  newPrice: number;
}

interface NewAct {
  acte: string;
  categorie: string;
  prix_usd: number;
}

interface PreviewData {
  updates: MatchedUpdate[];
  creates: NewAct[];
  errors: ErrorRow[];
  totalRows: number;
}

interface Props {
  existingActs: MedicalAct[];
  usdToCdf: number;
  userName: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportTarifsModal({ existingActs, usdToCdf, userName, userId, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'applying' | 'done'>('upload');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ updated: number; created: number } | null>(null);

  const normalize = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

  const handleFile = useCallback((file: File) => {
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX: typeof XLSXType = await import('xlsx');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        if (rows.length === 0) {
          setError('Le fichier est vide ou ne contient aucune ligne de donnees.');
          return;
        }

        const firstRow = rows[0];
        const keys = Object.keys(firstRow);
        const hasHeaders = keys.some(k => normalize(k).includes('categorie') || normalize(k).includes('acte') || normalize(k).includes('prix'));

        let catKey = keys[0];
        let acteKey = keys[1];
        let prixKey = keys[2];

        if (hasHeaders) {
          for (const k of keys) {
            const n = normalize(k);
            if (n.includes('categorie') || n === 'category') catKey = k;
            else if (n.includes('acte') || n === 'act_name') acteKey = k;
            else if (n.includes('prix') || n.includes('price') || n.includes('usd')) prixKey = k;
          }
        }

        const parsed: ParsedRow[] = [];
        const errors: ErrorRow[] = [];

        rows.forEach((row, idx) => {
          const rowIndex = idx + 2;
          const categorie = String(row[catKey] ?? '').trim();
          const acte = String(row[acteKey] ?? '').trim();
          const rawPrix = row[prixKey];
          const prix = typeof rawPrix === 'number' ? rawPrix : parseFloat(String(rawPrix).replace(',', '.').replace(/[^\d.]/g, ''));

          if (!acte) {
            errors.push({ rowIndex, reason: 'Nom d\'acte manquant', raw: row });
            return;
          }
          if (isNaN(prix) || prix < 0) {
            errors.push({ rowIndex, reason: `Prix invalide: "${rawPrix}"`, raw: row });
            return;
          }
          if (!categorie) {
            errors.push({ rowIndex, reason: 'Categorie manquante', raw: row });
            return;
          }

          parsed.push({ rowIndex, categorie, acte, prix_usd: Math.round(prix * 100) / 100 });
        });

        const updates: MatchedUpdate[] = [];
        const creates: NewAct[] = [];

        for (const row of parsed) {
          const match = existingActs.find(
            a => normalize(a.category) === normalize(row.categorie)
              && normalize(a.act_name) === normalize(row.acte)
          ) || existingActs.find(
            a => normalize(a.act_name) === normalize(row.acte)
          );

          if (match) {
            if (Math.abs(match.price_usd - row.prix_usd) > 0.001) {
              updates.push({
                existingId: match.id,
                acte: row.acte,
                categorie: row.categorie,
                oldPrice: match.price_usd,
                newPrice: row.prix_usd,
              });
            }
          } else {
            creates.push({ acte: row.acte, categorie: row.categorie, prix_usd: row.prix_usd });
          }
        }

        setPreview({ updates, creates, errors, totalRows: rows.length });
        setStep('preview');
      } catch {
        setError('Impossible de lire le fichier. Verifiez qu\'il s\'agit d\'un fichier .xlsx ou .csv valide.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [existingActs]);

  async function applyImport() {
    if (!preview) return;
    setStep('applying');

    const total = preview.updates.length + preview.creates.length;
    setProgress({ current: 0, total });
    let done = 0;

    try {
      const now = new Date().toISOString();

      for (const u of preview.updates) {
        const priceCdf = usdToCdf > 0 ? Math.round(u.newPrice * usdToCdf) : 0;
        await supabase.from('medical_acts_pricing').update({
          price_usd: u.newPrice,
          price_cdf: priceCdf,
          updated_at: now,
          updated_by: userId,
          updated_by_name: userName,
        }).eq('id', u.existingId);
        done++;
        setProgress({ current: done, total });
      }

      for (const c of preview.creates) {
        const priceCdf = usdToCdf > 0 ? Math.round(c.prix_usd * usdToCdf) : 0;
        await supabase.from('medical_acts_pricing').insert({
          act_name: c.acte,
          category: c.categorie,
          price_usd: c.prix_usd,
          price_cdf: priceCdf,
          is_active: true,
          updated_by: userId,
          updated_by_name: userName,
        });
        done++;
        setProgress({ current: done, total });
      }

      await supabase.from('tarif_import_logs').insert({
        imported_by: userId,
        imported_by_name: userName,
        total_rows: preview.totalRows,
        acts_updated: preview.updates.length,
        acts_created: preview.creates.length,
        errors_count: preview.errors.length,
        taux_change_applique: usdToCdf || null,
        details: {
          updates: preview.updates.map(u => ({ acte: u.acte, old: u.oldPrice, new: u.newPrice })),
          creates: preview.creates.map(c => ({ acte: c.acte, categorie: c.categorie, prix: c.prix_usd })),
          errors: preview.errors.map(e => ({ row: e.rowIndex, reason: e.reason })),
        },
      });

      await logActivity('update', 'expenses',
        `Import tarifs: ${preview.updates.length} mis a jour, ${preview.creates.length} crees depuis "${fileName}"`,
        { metadata: { file: fileName, updates: preview.updates.length, creates: preview.creates.length } }
      );

      setResult({ updated: preview.updates.length, created: preview.creates.length });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'import');
      setStep('preview');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Importer des tarifs</h2>
              <p className="text-xs text-gray-500">Format attendu : categorie, acte, prix_usd</p>
            </div>
          </div>
          <button onClick={onClose} disabled={step === 'applying'} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step: Upload */}
          {step === 'upload' && (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                className="border-2 border-dashed border-emerald-200 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
              >
                <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Cliquez ou glissez-deposez un fichier</p>
                <p className="text-xs text-gray-400 mt-1">.xlsx ou .csv</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700 space-y-1">
                    <p className="font-medium">Format attendu du fichier :</p>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-blue-100/50">
                          <th className="px-2 py-1 border border-blue-200">categorie</th>
                          <th className="px-2 py-1 border border-blue-200">acte</th>
                          <th className="px-2 py-1 border border-blue-200">prix_usd</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-2 py-1 border border-blue-200">Consultation</td>
                          <td className="px-2 py-1 border border-blue-200">Consultation generale</td>
                          <td className="px-2 py-1 border border-blue-200">25.00</td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 border border-blue-200">Laboratoire</td>
                          <td className="px-2 py-1 border border-blue-200">Hemogramme</td>
                          <td className="px-2 py-1 border border-blue-200">15.00</td>
                        </tr>
                      </tbody>
                    </table>
                    <p>Le prix CDF sera calcule automatiquement a partir du taux de change en vigueur.</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </>
          )}

          {/* Step: Preview */}
          {step === 'preview' && preview && (
            <>
              {/* Exchange rate info */}
              {usdToCdf > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                  <ArrowRightLeft className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Taux applique : <strong>1 USD = {usdToCdf.toLocaleString('fr-FR')} CDF</strong></span>
                </div>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{preview.updates.length}</p>
                  <p className="text-xs text-blue-600">Actes mis a jour</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{preview.creates.length}</p>
                  <p className="text-xs text-green-600">Nouveaux actes</p>
                </div>
                <div className={`rounded-xl p-3 text-center border ${preview.errors.length > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-2xl font-bold ${preview.errors.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>{preview.errors.length}</p>
                  <p className={`text-xs ${preview.errors.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>Erreurs</p>
                </div>
              </div>

              {/* Updates table */}
              {preview.updates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Mises a jour de prix</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Acte</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Categorie</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Ancien prix</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-600"></th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Nouveau prix</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.updates.map((u, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 font-medium text-gray-900">{u.acte}</td>
                            <td className="px-3 py-1.5 text-gray-500 text-xs">{u.categorie}</td>
                            <td className="px-3 py-1.5 text-right text-red-500 line-through">{u.oldPrice.toFixed(2)} $</td>
                            <td className="px-3 py-1.5 text-center"><ArrowRight className="w-3.5 h-3.5 text-gray-400 mx-auto" /></td>
                            <td className="px-3 py-1.5 text-right font-semibold text-green-700">{u.newPrice.toFixed(2)} $</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Creates table */}
              {preview.creates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Nouveaux actes a creer</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Acte</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Categorie</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Prix USD</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Prix CDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.creates.map((c, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 font-medium text-gray-900">{c.acte}</td>
                            <td className="px-3 py-1.5 text-gray-500 text-xs">{c.categorie}</td>
                            <td className="px-3 py-1.5 text-right font-semibold text-gray-800">{c.prix_usd.toFixed(2)} $</td>
                            <td className="px-3 py-1.5 text-right text-gray-500">
                              {usdToCdf > 0 ? `${Math.round(c.prix_usd * usdToCdf).toLocaleString('fr-FR')} CDF` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 mb-2">Lignes en erreur (ignorees)</h3>
                  <div className="border border-red-200 rounded-xl overflow-hidden max-h-32 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-red-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-600">Ligne</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-600">Raison</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {preview.errors.map((er, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-mono text-gray-700">{er.rowIndex}</td>
                            <td className="px-3 py-1.5 text-red-600">{er.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.updates.length === 0 && preview.creates.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-yellow-800">Aucune modification a appliquer</p>
                  <p className="text-xs text-yellow-600 mt-1">Tous les actes du fichier ont deja les memes prix, ou toutes les lignes sont en erreur.</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </>
          )}

          {/* Step: Applying */}
          {step === 'applying' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-700">Application en cours...</p>
              <p className="text-xs text-gray-500 mt-1">{progress.current} / {progress.total} operations</p>
              <div className="w-64 mx-auto mt-3 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && result && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Import termine</h3>
              <div className="space-y-1 text-sm text-gray-600">
                {result.updated > 0 && <p><strong>{result.updated}</strong> acte(s) mis a jour</p>}
                {result.created > 0 && <p><strong>{result.created}</strong> acte(s) cree(s)</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          {step === 'preview' && (
            <>
              <button
                onClick={() => { setStep('upload'); setPreview(null); setError(''); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Choisir un autre fichier
              </button>
              <button
                onClick={applyImport}
                disabled={(preview?.updates.length ?? 0) + (preview?.creates.length ?? 0) === 0}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmer l'import
              </button>
            </>
          )}
          {step === 'done' && (
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Fermer
            </button>
          )}
          {step === 'upload' && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
