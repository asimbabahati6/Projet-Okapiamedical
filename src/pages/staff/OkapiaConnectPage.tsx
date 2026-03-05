import { useState, useEffect, useRef } from 'react';
import {
  Send, Hash, User, ChevronLeft, ChevronRight,
  Search, Plus, MoreVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CreateChannelModal from '../../components/chat/CreateChannelModal';
import NewConversationModal from '../../components/chat/NewConversationModal';
import FileAttachmentUpload from '../../components/chat/FileAttachmentUpload';
import MessageAttachments from '../../components/chat/MessageAttachments';

interface Channel {
  id: string;
  name: string;
  slug: string;
  type: string;
  icon: string;
  color: string;
  unreadCount?: number;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    full_name: string;
    role: string;
  };
  attachments?: Attachment[];
  patient_reference?: string;
  exam_reference?: string;
}

interface DirectConversation {
  id: string;
  otherUser: {
    id: string;
    full_name: string;
    role: string;
    status: string;
  };
  unreadCount?: number;
}

export default function OkapiaConnectPage() {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<DirectConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChannels();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelMessages(selectedChannel.id);
    } else if (selectedConversation) {
      fetchDirectMessages(selectedConversation.id);
    }
  }, [selectedChannel, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setChannels(data || []);

      if (data && data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_direct_conversations')
        .select(`
          id,
          participant_1,
          participant_2
        `)
        .or(`participant_1.eq.${user?.id},participant_2.eq.${user?.id}`);

      if (error) throw error;

      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1;

          // Essayer d'abord la vue
          let userData: any = null;
          const { data: viewData } = await supabase
            .from('user_profiles_with_email')
            .select('id, full_name, role')
            .eq('id', otherUserId)
            .maybeSingle();

          if (viewData) {
            userData = viewData;
          } else {
            // Fallback
            const { data: directData } = await supabase
              .from('user_profiles')
              .select('id, full_name, role_id')
              .eq('id', otherUserId)
              .maybeSingle();

            if (directData) {
              const { data: roleData } = await supabase
                .from('roles')
                .select('name')
                .eq('id', directData.role_id)
                .maybeSingle();

              userData = {
                id: directData.id,
                full_name: directData.full_name,
                role: roleData?.name || 'Utilisateur'
              };
            }
          }

          const { data: statusData } = await supabase
            .from('chat_user_status')
            .select('status')
            .eq('user_id', otherUserId)
            .maybeSingle();

          return {
            id: conv.id,
            otherUser: {
              id: userData?.id || otherUserId,
              full_name: userData?.full_name || 'Utilisateur',
              role: userData?.role || 'Utilisateur',
              status: statusData?.status || 'offline'
            }
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchChannelMessages = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:user_profiles!chat_messages_sender_id_fkey(
            full_name,
            role_id,
            role:roles(name)
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data to match expected interface
      const transformedData = (data || []).map(msg => ({
        ...msg,
        sender: {
          full_name: msg.sender?.full_name || 'Utilisateur',
          role: msg.sender?.role?.name || 'Utilisateur'
        }
      }));

      setMessages(transformedData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchDirectMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:user_profiles!chat_messages_sender_id_fkey(
            full_name,
            role_id,
            role:roles(name)
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data to match expected interface
      const transformedData = (data || []).map(msg => ({
        ...msg,
        sender: {
          full_name: msg.sender?.full_name || 'Utilisateur',
          role: msg.sender?.role?.name || 'Utilisateur'
        }
      }));

      setMessages(transformedData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && currentAttachments.length === 0) return;

    try {
      const messageData: any = {
        sender_id: user?.id,
        content: messageInput.trim() || '📎 Fichier(s) attaché(s)'
      };

      if (selectedChannel) {
        messageData.channel_id = selectedChannel.id;
      } else if (selectedConversation) {
        messageData.conversation_id = selectedConversation.id;
      }

      // Add attachments if any
      if (currentAttachments.length > 0) {
        messageData.attachments = currentAttachments;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) throw error;

      setMessageInput('');
      setCurrentAttachments([]);

      if (selectedChannel) {
        fetchChannelMessages(selectedChannel.id);
      } else if (selectedConversation) {
        fetchDirectMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      hash: Hash,
      flask: Hash,
      pill: Hash,
      scan: Hash,
      stethoscope: Hash,
      briefcase: Hash,
      'alert-triangle': Hash
    };
    return icons[iconName] || Hash;
  };

  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-600 bg-cyan-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50'
  };

  const statusColors: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`bg-gradient-to-b from-cyan-700 to-cyan-900 text-white transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-16' : 'w-80'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-cyan-600 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold">OKAPIA Connect</h1>
              <p className="text-xs text-cyan-200">Messagerie Interne</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-cyan-600 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-300" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 bg-cyan-800 text-white placeholder-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>
        )}

        {/* Channels & Conversations */}
        <div className="flex-1 overflow-y-auto">
          {!isCollapsed && (
            <>
              {/* Channels Section */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-cyan-200">Canaux</h3>
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    className="p-1 hover:bg-cyan-600 rounded transition-colors"
                    title="Créer un nouveau canal"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {channels.map((channel) => {
                    const Icon = getIconComponent(channel.icon);
                    const isSelected = selectedChannel?.id === channel.id;

                    return (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setSelectedChannel(channel);
                          setSelectedConversation(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-cyan-600' : 'hover:bg-cyan-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{channel.name}</span>
                        {channel.unreadCount && channel.unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {channel.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Messages Section */}
              <div className="px-4 py-2 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-cyan-200">Messages Directs</h3>
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="p-1 hover:bg-cyan-600 rounded transition-colors"
                    title="Nouvelle conversation"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {conversations.map((conv) => {
                    const isSelected = selectedConversation?.id === conv.id;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setSelectedChannel(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-cyan-600' : 'hover:bg-cyan-800'
                        }`}
                      >
                        <div className="relative">
                          <User className="w-5 h-5 flex-shrink-0" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-cyan-700 ${statusColors[conv.otherUser.status]}`} />
                        </div>
                        <span className="text-sm font-medium truncate">{conv.otherUser.full_name}</span>
                        {conv.unreadCount && conv.unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {conversations.length === 0 && (
                    <p className="text-xs text-cyan-300 text-center py-4">Aucune conversation</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedChannel && (
                <>
                  <div className={`p-2 rounded-lg ${colorClasses[selectedChannel.color]}`}>
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedChannel.name}</h2>
                    <p className="text-sm text-gray-500">{channels.find(c => c.id === selectedChannel.id)?.type === 'public' ? 'Canal Public' : 'Canal de Service'}</p>
                  </div>
                </>
              )}
              {selectedConversation && (
                <>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConversation.otherUser.full_name.charAt(0)}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[selectedConversation.otherUser.status]}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedConversation.otherUser.full_name}</h2>
                    <p className="text-sm text-gray-500 capitalize">{selectedConversation.otherUser.status}</p>
                  </div>
                </>
              )}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-2xl ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{message.sender.full_name}</span>
                      <span className="text-xs text-gray-500">{message.sender.role}</span>
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-cyan-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Display attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <MessageAttachments attachments={message.attachments} />
                    )}

                    {message.patient_reference && (
                      <div className="mt-2 pt-2 border-t border-cyan-500">
                        <button className="text-xs font-medium flex items-center gap-1 hover:underline">
                          Voir le dossier patient
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="space-y-3">
            <div className="flex items-end gap-3">
              <FileAttachmentUpload
                onAttachmentsChange={setCurrentAttachments}
              />

              <div className="flex-1">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder={`Envoyer un message ${selectedChannel ? `dans #${selectedChannel.slug}` : ''}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  rows={1}
                />
              </div>

              <button
                type="submit"
                disabled={!messageInput.trim() && currentAttachments.length === 0}
                className="p-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onSuccess={async (channelId) => {
            console.log('=== CreateChannelModal onSuccess ===');
            console.log('Channel ID:', channelId);

            try {
              // Récupérer le canal créé
              const { data: newChannel, error: channelError } = await supabase
                .from('chat_channels')
                .select('*')
                .eq('id', channelId)
                .maybeSingle();

              console.log('Channel data:', newChannel, 'Error:', channelError);

              if (channelError) {
                console.error('Error fetching channel:', channelError);
              }

              // Rafraîchir la liste des canaux
              await fetchChannels();

              // Sélectionner le nouveau canal automatiquement
              if (newChannel) {
                console.log('✅ Selecting new channel:', newChannel.name);
                setSelectedChannel(newChannel);
                setSelectedConversation(null);
              }
            } catch (error) {
              console.error('Error in onSuccess:', error);
              // Au moins rafraîchir la liste
              await fetchChannels();
            } finally {
              setShowCreateChannel(false);
            }
          }}
        />
      )}

      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onSuccess={async (conversationId) => {
            console.log('=== onSuccess called with conversationId:', conversationId);

            try {
              // 1. Récupérer la conversation créée
              const { data: convData, error: convError } = await supabase
                .from('chat_direct_conversations')
                .select('id, participant_1, participant_2')
                .eq('id', conversationId)
                .maybeSingle();

              console.log('Conversation data:', convData, 'Error:', convError);

              if (convError) {
                console.error('Error fetching conversation:', convError);
                throw convError;
              }

              if (!convData) {
                throw new Error('Conversation not found');
              }

              // 2. Identifier l'autre utilisateur
              const otherUserId = convData.participant_1 === user?.id
                ? convData.participant_2
                : convData.participant_1;

              console.log('Other user ID:', otherUserId);

              // 3. Récupérer les infos utilisateur avec fallback robuste
              let userInfo: any = null;

              // Essai 1: Vue user_profiles_with_email
              const { data: viewData, error: viewError } = await supabase
                .from('user_profiles_with_email')
                .select('id, full_name, role')
                .eq('id', otherUserId)
                .maybeSingle();

              console.log('View data:', viewData, 'Error:', viewError);

              if (viewData) {
                userInfo = viewData;
              } else {
                // Essai 2: user_profiles + roles
                console.log('Fallback to user_profiles...');

                const { data: profileData, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('id, full_name, role_id')
                  .eq('id', otherUserId)
                  .maybeSingle();

                console.log('Profile data:', profileData, 'Error:', profileError);

                if (profileError) {
                  console.error('Error fetching profile:', profileError);
                }

                if (profileData) {
                  // Récupérer le nom du rôle
                  const { data: roleData } = await supabase
                    .from('roles')
                    .select('name')
                    .eq('id', profileData.role_id)
                    .maybeSingle();

                  console.log('Role data:', roleData);

                  userInfo = {
                    id: profileData.id,
                    full_name: profileData.full_name,
                    role: roleData?.name || 'Utilisateur'
                  };
                } else {
                  // Fallback ultime
                  userInfo = {
                    id: otherUserId,
                    full_name: 'Utilisateur',
                    role: 'Utilisateur'
                  };
                }
              }

              console.log('Final user info:', userInfo);

              // 4. Récupérer le statut
              const { data: statusData } = await supabase
                .from('chat_user_status')
                .select('status')
                .eq('user_id', otherUserId)
                .maybeSingle();

              console.log('Status data:', statusData);

              // 5. Construire l'objet conversation
              const newConversation: DirectConversation = {
                id: conversationId,
                otherUser: {
                  id: userInfo.id,
                  full_name: userInfo.full_name,
                  role: userInfo.role,
                  status: statusData?.status || 'offline'
                }
              };

              console.log('New conversation object:', newConversation);

              // 6. Sélectionner la conversation IMMÉDIATEMENT
              setSelectedConversation(newConversation);
              setSelectedChannel(null);

              console.log('Conversation selected!');

              // 7. Rafraîchir la liste en arrière-plan
              fetchConversations().catch(err =>
                console.error('Error refreshing conversations:', err)
              );

            } catch (error) {
              console.error('=== CRITICAL ERROR in onSuccess:', error);

              // Même en cas d'erreur, on rafraîchit la liste
              try {
                await fetchConversations();

                // Essayer de sélectionner la conversation malgré l'erreur
                const convs = await supabase
                  .from('chat_direct_conversations')
                  .select('*')
                  .eq('id', conversationId)
                  .maybeSingle();

                if (convs.data) {
                  console.log('Fallback: found conversation, will refresh list');
                }
              } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
              }
            } finally {
              // Toujours fermer le modal
              setShowNewConversation(false);
            }
          }}
        />
      )}
    </div>
  );
}
