import { useState } from 'react';
import { X, FileText, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ImportNewsModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  categories: Array<{ id: string; name: string }>;
}

export function ImportNewsModal({ onClose, onSuccess, onError, categories }: ImportNewsModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: 'LinkedIn',
    source_url: '',
    category_id: '',
    tags: [] as string[],
    image_url: '',
    published_date: '',
  });

  async function handleImport() {
    if (!formData.title.trim()) {
      onError('Le titre est requis');
      return;
    }

    if (!formData.content.trim()) {
      onError('Le contenu est requis');
      return;
    }

    if (!formData.category_id) {
      onError('La catégorie est requise');
      return;
    }

    try {
      setLoading(true);

      const cleanedContent = formData.content
        .replace(/\n\n+/g, '</p><p>')
        .replace(/\n/g, '<br/>');

      const postData = {
        title: formData.title.trim(),
        content: `<p>${cleanedContent}</p>`,
        featured_image_url: formData.image_url || null,
        category_id: formData.category_id,
        tags: formData.tags,
        status: 'brouillon',
        author_id: profile?.id,
        published_at: null,
      };

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;

      onSuccess();
    } catch (err: any) {
      console.error('Error importing news:', err);
      onError(err.message || 'Erreur lors de l\'importation');
    } finally {
      setLoading(false);
    }
  }

  function parseLinkedInContent(pastedText: string) {
    const lines = pastedText.split('\n').filter(line => line.trim());

    if (lines.length > 0) {
      setFormData(prev => ({
        ...prev,
        title: lines[0].substring(0, 200),
        content: lines.slice(1).join('\n\n')
      }));
    }
  }

  const getCategoryName = (categoryName: string) => {
    const names: { [key: string]: string } = {
      innovation: 'Innovation',
      événement: 'Événement',
      produit: 'Produit',
      actualité: 'Actualité',
      santé: 'Santé',
    };
    return names[categoryName] || categoryName;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Importer depuis LinkedIn</h2>
              <p className="text-sm text-gray-600">Collez le contenu d'une publication LinkedIn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions :</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Allez sur la page LinkedIn d'OKAPIA Médical</li>
                  <li>Copiez le texte de la publication que vous souhaitez importer</li>
                  <li>Collez-le dans la zone de texte ci-dessous</li>
                  <li>Ajoutez les informations complémentaires (catégorie, tags, image)</li>
                  <li>Cliquez sur "Continuer" pour finaliser l'import</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de la publication LinkedIn <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={12}
                  value={formData.title + '\n\n' + formData.content}
                  onChange={(e) => parseLinkedInContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Collez ici le contenu complet de la publication LinkedIn...&#10;&#10;La première ligne sera utilisée comme titre.&#10;Le reste sera le contenu de l'article."
                />
                <p className="text-sm text-gray-500 mt-2">
                  La première ligne sera automatiquement utilisée comme titre
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (!formData.title.trim() || !formData.content.trim()) {
                      onError('Veuillez coller du contenu avant de continuer');
                      return;
                    }
                    setStep(2);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Contenu importé avec succès !</span>
                </div>
                <p className="text-sm text-green-700">
                  Complétez les informations ci-dessous avant d'enregistrer.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.title.length}/200 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aperçu du contenu
                </label>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.content}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'image (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryName(category.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL source LinkedIn (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.linkedin.com/posts/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="innovation, santé, technologie"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ← Retour
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Importation...' : 'Enregistrer comme brouillon'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
