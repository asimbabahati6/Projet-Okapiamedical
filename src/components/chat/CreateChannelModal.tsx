import { useState } from 'react';
import { X, Hash, Lock, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CreateChannelModalProps {
  onClose: () => void;
  onSuccess: (channelId: string) => void;
}

export default function CreateChannelModal({ onClose, onSuccess }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'public' | 'service' | 'private'>('public');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('hash');
  const [color, setColor] = useState('cyan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const colors = [
    { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
    { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
    { value: 'green', label: 'Vert', class: 'bg-green-500' },
    { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
    { value: 'red', label: 'Rouge', class: 'bg-red-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Le nom du canal est requis');
      return;
    }

    console.log('=== handleSubmit START ===');
    console.log('Channel data:', { name: name.trim(), type, description, icon, color });

    setLoading(true);

    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      console.log('Current user:', user.id);

      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      console.log('Generated slug:', slug);

      const { data: newChannel, error: insertError } = await supabase
        .from('chat_channels')
        .insert({
          name: name.trim(),
          slug,
          type,
          description: description.trim() || null,
          icon,
          color,
          is_active: true,
          created_by: user.id  // ✅ Ajout du created_by requis par la policy
        })
        .select()
        .maybeSingle();

      console.log('Insert result:', newChannel, 'Error:', insertError);

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      if (!newChannel) {
        console.error('❌ No channel data returned');
        throw new Error('Impossible de créer le canal');
      }

      console.log('✅ Channel created successfully:', newChannel.id);

      // ✅ FIX: Auto-add creator as a member of the channel
      // This is crucial for Private and Service channels to be visible to the creator
      console.log('Adding creator to channel members...');

      const { error: memberError } = await supabase
        .from('chat_members')
        .insert({
          channel_id: newChannel.id,
          user_id: user.id,
          role: 'admin' // Creator is admin of their channel
        });

      if (memberError) {
        console.warn('⚠️ Warning: Could not add creator to members:', memberError);
        // Don't throw - channel is created, just log warning
      } else {
        console.log('✅ Creator added to channel members as admin');
      }

      console.log('Calling onSuccess with ID:', newChannel.id);

      onSuccess(newChannel.id);
      onClose();
    } catch (err: any) {
      console.error('=== ERROR in handleSubmit ===', err);
      setError(err.message || 'Erreur lors de la création du canal');
    } finally {
      console.log('=== handleSubmit END ===');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Créer un Canal</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du Canal *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Général, Urgences, Laboratoire..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de Canal *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setType('public')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'public'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Globe className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <div className="text-xs font-medium text-gray-900">Public</div>
              </button>

              <button
                type="button"
                onClick={() => setType('service')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'service'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Hash className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <div className="text-xs font-medium text-gray-900">Service</div>
              </button>

              <button
                type="button"
                onClick={() => setType('private')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'private'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Lock className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <div className="text-xs font-medium text-gray-900">Privé</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le but de ce canal..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-10 rounded-lg ${c.class} transition-all ${
                    color === c.value
                      ? 'ring-2 ring-offset-2 ring-gray-900'
                      : 'hover:opacity-80'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer le Canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
