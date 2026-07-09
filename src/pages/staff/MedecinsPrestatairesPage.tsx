import { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit2, ToggleLeft, ToggleRight, Shield, UserCheck, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';

type MedecinType = 'prestataire' | 'apporteur' | 'les_deux';

interface MedecinPrestataire {
  id: string;
  nom_complet: string;
  specialite: string | null;
  telephone: string | null;
  type: MedecinType;
  actif: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<MedecinType, string> = {
  prestataire: 'Honoraire (preste)',
  apporteur: 'Apporteur (envoie)',
  les_deux: 'Les deux',
};

const TYPE_COLORS: Record<MedecinType, string> = {
  prestataire: 'bg-blue-100 text-blue-700',
  apporteur: 'bg-amber-100 text-amber-700',
  les_deux: 'bg-teal-100 text-teal-700',
};

export default function MedecinsPrestatairesPage() {
  const { isDirecteurGeneral } = useFinancialPermissions();
  const canWrite = isDirecteurGeneral;

  const [medecins, setMedecins] = useState<MedecinPrestataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<MedecinType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MedecinPrestataire | null>(null);

  const [formNom, setFormNom] = useState('');
  const [formSpecialite, setFormSpecialite] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formType, setFormType] = useState<MedecinType>('prestataire');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchMedecins(); }, []);

  async function fetchMedecins() {
    setLoading(true);
    const { data, error } = await supabase
      .from('medecins_prestataires')
      .select('*')
      .order('nom_complet');
    if (!error && data) setMedecins(data);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setFormNom('');
    setFormSpecialite('');
    setFormTelephone('');
    setFormType('prestataire');
    setError(null);
    setShowModal(true);
  }

  function openEdit(m: MedecinPrestataire) {
    setEditing(m);
    setFormNom(m.nom_complet);
    setFormSpecialite(m.specialite || '');
    setFormTelephone(m.telephone || '');
    setFormType(m.type);
    setError(null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formNom.trim()) {
      setError('Le nom complet est requis.');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      nom_complet: formNom.trim(),
      specialite: formSpecialite.trim() || null,
      telephone: formTelephone.trim() || null,
      type: formType,
    };

    if (editing) {
      const { error: err } = await supabase
        .from('medecins_prestataires')
        .update(payload)
        .eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase
        .from('medecins_prestataires')
        .insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowModal(false);
    fetchMedecins();
  }

  async function toggleActive(m: MedecinPrestataire) {
    await supabase
      .from('medecins_prestataires')
      .update({ actif: !m.actif })
      .eq('id', m.id);
    fetchMedecins();
  }

  const filtered = medecins.filter(m => {
    const matchesSearch =
      m.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
      (m.telephone && m.telephone.includes(search)) ||
      (m.specialite && m.specialite.toLowerCase().includes(search.toLowerCase()));
    const matchesType = !filterType || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const activeCount = medecins.filter(m => m.actif).length;
  const byType = {
    prestataire: medecins.filter(m => m.type === 'prestataire').length,
    apporteur: medecins.filter(m => m.type === 'apporteur').length,
    les_deux: medecins.filter(m => m.type === 'les_deux').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medecins Prestataires</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des medecins externes et apporteurs</p>
        </div>
        {canWrite && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau medecin
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{medecins.length}</p>
              <p className="text-xs text-gray-500">Total</p>
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
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{byType.prestataire}</p>
              <p className="text-xs text-gray-500">Honoraires</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-teal-500">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{byType.apporteur + byType.les_deux}</p>
              <p className="text-xs text-gray-500">Apporteurs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, specialite ou telephone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as MedecinType | '')}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="prestataire">Honoraire (preste)</option>
            <option value="apporteur">Apporteur (envoie)</option>
            <option value="les_deux">Les deux</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun medecin prestataire trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Nom complet</th>
                  <th className="px-6 py-3">Specialite</th>
                  <th className="px-6 py-3">Telephone</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Statut</th>
                  {canWrite && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{m.nom_complet}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{m.specialite || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {m.telephone ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {m.telephone}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[m.type]}`}>
                        {TYPE_LABELS[m.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        m.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {m.actif ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        {m.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(m)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(m)}
                            className={`p-2 rounded-lg transition-colors ${
                              m.actif
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={m.actif ? 'Desactiver' : 'Activer'}
                          >
                            {m.actif ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!canWrite && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700">Acces en lecture seule. Seul le Directeur General peut ajouter ou modifier les medecins prestataires.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Modifier le medecin' : 'Nouveau medecin prestataire'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={formNom}
                  onChange={e => setFormNom(e.target.value)}
                  placeholder="Dr. Jean Kabongo"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialite</label>
                <input
                  type="text"
                  value={formSpecialite}
                  onChange={e => setFormSpecialite(e.target.value)}
                  placeholder="Chirurgie, Cardiologie..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input
                  type="text"
                  value={formTelephone}
                  onChange={e => setFormTelephone(e.target.value)}
                  placeholder="+243 XXX XXX XXX"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as MedecinType)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="prestataire">Honoraire (preste des actes)</option>
                  <option value="apporteur">Apporteur (envoie des patients)</option>
                  <option value="les_deux">Les deux</option>
                </select>
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
                {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
