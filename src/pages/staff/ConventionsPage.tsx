import { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit2, ToggleLeft, ToggleRight, Shield, Building2, Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';

interface Convention {
  id: string;
  nom: string;
  code: string | null;
  taux_prise_en_charge: number | null;
  notes: string | null;
  actif: boolean;
  created_at: string;
}

export default function ConventionsPage() {
  const { isDirecteurGeneral } = useFinancialPermissions();
  const canWrite = isDirecteurGeneral;

  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConvention, setEditingConvention] = useState<Convention | null>(null);

  const [formNom, setFormNom] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTaux, setFormTaux] = useState('');
  const [formActif, setFormActif] = useState(true);
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchConventions(); }, []);

  async function fetchConventions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('conventions')
      .select('*')
      .order('nom');
    if (!error && data) setConventions(data);
    setLoading(false);
  }

  function openAdd() {
    setEditingConvention(null);
    setFormNom('');
    setFormCode('');
    setFormTaux('');
    setFormActif(true);
    setFormNotes('');
    setError(null);
    setShowModal(true);
  }

  function openEdit(conv: Convention) {
    setEditingConvention(conv);
    setFormNom(conv.nom);
    setFormCode(conv.code || '');
    setFormTaux(conv.taux_prise_en_charge != null ? String(conv.taux_prise_en_charge) : '');
    setFormActif(conv.actif);
    setFormNotes(conv.notes || '');
    setError(null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formNom.trim()) {
      setError('Le nom de l\'organisme est requis.');
      return;
    }

    const tauxNum = formTaux.trim() ? parseFloat(formTaux) : null;
    if (tauxNum !== null && (isNaN(tauxNum) || tauxNum < 0 || tauxNum > 100)) {
      setError('Le taux de prise en charge doit etre entre 0 et 100.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      nom: formNom.trim(),
      code: formCode.trim() || null,
      taux_prise_en_charge: tauxNum,
      actif: formActif,
      notes: formNotes.trim() || null,
    };

    if (editingConvention) {
      const { error: err } = await supabase
        .from('conventions')
        .update(payload)
        .eq('id', editingConvention.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase
        .from('conventions')
        .insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowModal(false);
    fetchConventions();
  }

  async function toggleActive(conv: Convention) {
    await supabase
      .from('conventions')
      .update({ actif: !conv.actif })
      .eq('id', conv.id);
    fetchConventions();
  }

  const filtered = conventions.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = conventions.filter(c => c.actif).length;

  function exportPDF() {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Okapia Medical', 14, 20);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Liste des Conventions', 14, 30);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Date d'extraction : ${dateStr} a ${timeStr}`, 14, 38);
    doc.text(`Total : ${filtered.length} convention(s)  |  Actives : ${filtered.filter(c => c.actif).length}  |  Inactives : ${filtered.filter(c => !c.actif).length}`, 14, 44);
    doc.setTextColor(0, 0, 0);

    const rows = filtered.map(c => [
      c.code || '-',
      c.nom,
      c.taux_prise_en_charge != null ? `${c.taux_prise_en_charge}%` : '-',
      c.actif ? 'Active' : 'Inactive',
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['Code', 'Organisme', 'Taux couverture', 'Statut']],
      body: rows,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 30 },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const val = data.cell.raw as string;
          if (val === 'Active') {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [156, 163, 175];
          }
        }
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Okapia Medical - Conventions - Page ${i}/${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`conventions_okapia_${now.toISOString().split('T')[0]}.pdf`);
  }

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conventions</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des organismes conventionnes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
          {canWrite && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle convention
            </button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{conventions.length}</p>
              <p className="text-xs text-gray-500">Total conventions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <ToggleRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500">Actives</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-gray-400">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <ToggleLeft className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{conventions.length - activeCount}</p>
              <p className="text-xs text-gray-500">Inactives</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune convention trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Nom</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Taux couverture</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date de creation</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(conv => (
                  <tr key={conv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{conv.nom}</span>
                        {conv.notes && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]" title={conv.notes}>{conv.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {conv.code ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-700">{conv.code}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {conv.taux_prise_en_charge != null ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          {conv.taux_prise_en_charge}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        conv.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {conv.actif ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        {conv.actif ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(conv.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canWrite ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(conv)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(conv)}
                            className={`p-2 rounded-lg transition-colors ${
                              conv.actif
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={conv.actif ? 'Desactiver' : 'Activer'}
                          >
                            {conv.actif ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Read-only notice */}
      {!canWrite && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700">Acces en lecture seule. Seuls le Directeur General et les administrateurs peuvent modifier les conventions.</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingConvention ? 'Modifier la convention' : 'Nouvelle convention'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'organisme *</label>
                <input
                  type="text"
                  value={formNom}
                  onChange={e => setFormNom(e.target.value)}
                  placeholder="Ex: Asyst, Rawbank, BCDC, SNCC..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code unique</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    placeholder="Ex: ASYST-001"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux prise en charge (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formTaux}
                    onChange={e => setFormTaux(e.target.value)}
                    placeholder="Ex: 80"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormActif(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      formActif
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ToggleRight className="w-4 h-4" />
                    Actif
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormActif(false)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      !formActif
                        ? 'bg-gray-100 border-gray-400 text-gray-700'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ToggleLeft className="w-4 h-4" />
                    Inactif
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Remarques</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Remarques particulieres sur cette convention..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : editingConvention ? 'Modifier' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
