import { useState, useEffect } from 'react';
import { X, Search, User, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  status?: string;
}

interface NewConversationModalProps {
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
}

export default function NewConversationModal({ onClose, onSuccess }: NewConversationModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const statusColors: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.id]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.full_name.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      // Essayer d'abord avec la vue user_profiles_with_email
      let usersData: any[] = [];

      const { data: viewData, error: viewError } = await supabase
        .from('user_profiles_with_email')
        .select('id, full_name, role')
        .neq('id', user?.id)
        .order('full_name');

      if (viewError) {
        console.warn('View not available, falling back to direct query:', viewError);

        // Fallback: récupérer directement depuis user_profiles
        const { data: directData, error: directError } = await supabase
          .from('user_profiles')
          .select('id, full_name, role_id')
          .neq('id', user?.id)
          .order('full_name');

        if (directError) throw directError;

        // Récupérer les noms des rôles
        const { data: rolesData } = await supabase
          .from('roles')
          .select('id, name');

        const rolesMap = new Map(rolesData?.map(r => [r.id, r.name]) || []);

        usersData = (directData || []).map(u => ({
          id: u.id,
          full_name: u.full_name,
          role: rolesMap.get(u.role_id) || 'Utilisateur'
        }));
      } else {
        usersData = viewData || [];
      }

      // Récupérer les statuts pour tous les utilisateurs
      const usersWithStatus = await Promise.all(
        usersData.map(async (u) => {
          const { data: statusData } = await supabase
            .from('chat_user_status')
            .select('status')
            .eq('user_id', u.id)
            .maybeSingle();

          return {
            ...u,
            status: statusData?.status || 'offline'
          };
        })
      );

      setUsers(usersWithStatus);
      setFilteredUsers(usersWithStatus);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser) {
      console.warn('No user selected');
      return;
    }

    console.log('=== handleCreateConversation START ===');
    console.log('Selected user:', selectedUser);
    console.log('Current user:', user?.id);

    setCreating(true);
    setError('');

    try {
      // ✅ FIX: Sort UUIDs to respect database constraint (participant_1 < participant_2)
      // We do this once at the beginning to use for both checking and creating
      const userId1 = user?.id || '';
      const userId2 = selectedUser.id;
      const [smallerUUID, largerUUID] = [userId1, userId2].sort();

      console.log('UUID sorting - participant_1:', smallerUUID, 'participant_2:', largerUUID);

      // Vérifier si une conversation existe déjà
      // Since we always store UUIDs in sorted order, we only need to check one direction
      console.log('Checking for existing conversation...');

      const { data: existingConv, error: checkError } = await supabase
        .from('chat_direct_conversations')
        .select('id')
        .eq('participant_1', smallerUUID)
        .eq('participant_2', largerUUID)
        .maybeSingle();

      console.log('Existing conversation check:', existingConv, 'Error:', checkError);

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Check error:', checkError);
      }

      if (existingConv) {
        // Conversation existe déjà, l'ouvrir
        console.log('✅ Found existing conversation:', existingConv.id);
        console.log('Calling onSuccess with ID:', existingConv.id);

        onSuccess(existingConv.id);
        onClose();
        return;
      }

      // Créer une nouvelle conversation
      console.log('Creating new conversation...');
      console.log('Using sorted UUIDs - participant_1:', smallerUUID, 'participant_2:', largerUUID);

      const { data: newConv, error: insertError } = await supabase
        .from('chat_direct_conversations')
        .insert({
          participant_1: smallerUUID,
          participant_2: largerUUID
        })
        .select()
        .maybeSingle();

      console.log('Insert result:', newConv, 'Error:', insertError);

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      if (newConv) {
        console.log('✅ Created new conversation:', newConv.id);
        console.log('Calling onSuccess with ID:', newConv.id);

        onSuccess(newConv.id);
        onClose();
      } else {
        console.error('❌ No conversation data returned');
        throw new Error('Impossible de créer la conversation');
      }
    } catch (err: any) {
      console.error('=== ERROR in handleCreateConversation ===', err);
      setError(err.message || 'Erreur lors de la création de la conversation');
    } finally {
      console.log('=== handleCreateConversation END ===');
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Nouvelle Conversation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou rôle..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    selectedUser?.id === u.id
                      ? 'bg-cyan-50 border-2 border-cyan-500'
                      : 'border-2 border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {u.full_name.charAt(0)}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        statusColors[u.status || 'offline']
                      }`}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{u.full_name}</div>
                    <div className="text-sm text-gray-500 capitalize">{u.role}</div>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{u.status || 'offline'}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={creating}
            >
              Annuler
            </button>
            <button
              onClick={handleCreateConversation}
              disabled={!selectedUser || creating}
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Création...' : 'Démarrer la Conversation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
