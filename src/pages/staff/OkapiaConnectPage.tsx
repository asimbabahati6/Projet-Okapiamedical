import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Hash, Plus, Search, User, Paperclip, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CreateChannelModal from '../../components/chat/CreateChannelModal';
import NewConversationModal from '../../components/chat/NewConversationModal';
import MessageAttachments from '../../components/chat/MessageAttachments';

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface DirectConversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_role: string;
  last_message?: string;
  last_message_at?: string;
  status?: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  previewUrl?: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  attachments?: Attachment[];
}

type ActiveView =
  | { type: 'channel'; data: Channel }
  | { type: 'conversation'; data: DirectConversation }
  | null;

export default function OkapiaConnectPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChannels();
    fetchDirectConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!activeView) return;
    setMessages([]);
    setLoading(true);

    if (activeView.type === 'channel') {
      fetchChannelMessages(activeView.data.id);
      markAsRead(activeView.data.id, null);
    } else {
      fetchConversationMessages(activeView.data.id);
      markAsRead(null, activeView.data.id);
    }
  }, [activeView]);

  useEffect(() => {
    if (!activeView) return;

    const filterId = activeView.type === 'channel'
      ? `channel_id=eq.${activeView.data.id}`
      : `conversation_id=eq.${activeView.data.id}`;

    const realtimeChannel = supabase
      .channel(`okapia-messages-${activeView.data.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: filterId },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          const senderId = row.sender_id as string;

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', senderId)
            .maybeSingle();

          const newMsg: Message = {
            id: row.id as string,
            sender_id: senderId,
            content: row.content as string,
            created_at: row.created_at as string,
            sender_name: profile?.full_name || 'Utilisateur',
            attachments: (row.attachments as Attachment[]) || [],
          };

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read since we're currently viewing this
          if (activeView.type === 'channel') {
            markAsRead(activeView.data.id, null);
          } else {
            markAsRead(null, activeView.data.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(realtimeChannel); };
  }, [activeView]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function markAsRead(channelId: string | null, conversationId: string | null) {
    if (!user?.id) return;
    try {
      await supabase.rpc('mark_chat_messages_read', {
        p_user_id: user.id,
        p_channel_id: channelId,
        p_conversation_id: conversationId,
      });
    } catch (err) {
      // Silent fail - not critical
    }
  }

  async function fetchChannels() {
    const { data } = await supabase
      .from('chat_channels')
      .select('id, name, slug, description')
      .order('name');

    if (data && data.length > 0) {
      setChannels(data as Channel[]);
    } else {
      setChannels([]);
    }
  }

  async function fetchDirectConversations() {
    if (!user?.id) return;

    const { data } = await supabase
      .from('chat_direct_conversations')
      .select('id, participant_1, participant_2, updated_at')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (!data || data.length === 0) {
      setConversations([]);
      return;
    }

    const otherUserIds = data.map(c =>
      c.participant_1 === user.id ? c.participant_2 : c.participant_1
    );

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, role_id')
      .in('id', otherUserIds);

    const { data: roles } = await supabase
      .from('roles')
      .select('id, name');

    const rolesMap = new Map(roles?.map(r => [r.id, r.name]) || []);
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const convs: DirectConversation[] = data.map(c => {
      const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
      const profile = profilesMap.get(otherId);
      return {
        id: c.id,
        participant_id: otherId,
        participant_name: profile?.full_name || 'Utilisateur',
        participant_role: rolesMap.get(profile?.role_id) || 'Utilisateur',
        last_message_at: c.updated_at,
      };
    });

    setConversations(convs);
  }

  async function fetchChannelMessages(channelId: string) {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, sender_id, content, created_at, attachments, sender:user_profiles!chat_messages_sender_id_fkey(full_name)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data.map((m: Record<string, unknown>) => {
        const sender = m.sender as { full_name: string } | null;
        return {
          id: m.id as string,
          sender_id: m.sender_id as string,
          content: m.content as string,
          created_at: m.created_at as string,
          sender_name: sender?.full_name || 'Utilisateur',
          attachments: (m.attachments as Attachment[]) || [],
        };
      }));
    }
    setLoading(false);
  }

  async function fetchConversationMessages(conversationId: string) {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, sender_id, content, created_at, attachments, sender:user_profiles!chat_messages_sender_id_fkey(full_name)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data.map((m: Record<string, unknown>) => {
        const sender = m.sender as { full_name: string } | null;
        return {
          id: m.id as string,
          sender_id: m.sender_id as string,
          content: m.content as string,
          created_at: m.created_at as string,
          sender_name: sender?.full_name || 'Utilisateur',
          attachments: (m.attachments as Attachment[]) || [],
        };
      }));
    }
    setLoading(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !user?.id) return;

    setUploading(true);
    const uploaded: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) continue;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) continue;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path);

      uploaded.push({
        id: data.path,
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }

    setAttachments(prev => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeAttachment(att: Attachment) {
    if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    supabase.storage.from('chat-attachments').remove([att.id]);
    setAttachments(prev => prev.filter(a => a.id !== att.id));
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const hasContent = messageInput.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if ((!hasContent && !hasAttachments) || !activeView || !user?.id) return;

    const content = hasContent ? messageInput.trim() : (hasAttachments ? 'Fichier(s) joint(s)' : '');
    const msgAttachments = attachments.map(({ id, name, url, type, size }) => ({ id, name, url, type, size }));

    setMessageInput('');
    setAttachments([]);

    const insertData: Record<string, unknown> = {
      sender_id: user.id,
      content,
      attachments: msgAttachments.length > 0 ? msgAttachments : [],
    };

    if (activeView.type === 'channel') {
      insertData.channel_id = activeView.data.id;
    } else {
      insertData.conversation_id = activeView.data.id;
    }

    await supabase.from('chat_messages').insert(insertData);
  }

  function handleSelectChannel(channel: Channel) {
    setActiveView({ type: 'channel', data: channel });
  }

  function handleSelectConversation(conv: DirectConversation) {
    setActiveView({ type: 'conversation', data: conv });
  }

  function handleConversationCreated(conversationId: string) {
    setShowNewConversation(false);
    fetchDirectConversations().then(() => {
      const existing = conversations.find(c => c.id === conversationId);
      if (existing) {
        setActiveView({ type: 'conversation', data: existing });
      } else {
        fetchDirectConversations().then(() => {
          setConversations(prev => {
            const found = prev.find(c => c.id === conversationId);
            if (found) setActiveView({ type: 'conversation', data: found });
            return prev;
          });
        });
      }
    });
  }

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(c =>
    c.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.participant_role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHeaderInfo = () => {
    if (!activeView) return null;
    if (activeView.type === 'channel') {
      return {
        icon: <Hash className="w-4 h-4 text-gray-400" />,
        title: activeView.data.name,
        subtitle: activeView.data.description,
      };
    }
    return {
      icon: <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
        {activeView.data.participant_name.charAt(0)}
      </div>,
      title: activeView.data.participant_name,
      subtitle: activeView.data.participant_role,
    };
  };

  const getPlaceholder = () => {
    if (!activeView) return '';
    if (activeView.type === 'channel') {
      return `Ecrire dans #${activeView.data.name}...`;
    }
    return `Ecrire a ${activeView.data.participant_name}...`;
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600" />
              OKAPIA Connect
            </h2>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Creer un canal"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChannels.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Canaux</span>
              </div>
              {filteredChannels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => handleSelectChannel(channel)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors ${
                    activeView?.type === 'channel' && activeView.data.id === channel.id
                      ? 'bg-cyan-50 text-cyan-700 border-r-2 border-cyan-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Hash className="w-4 h-4 opacity-50 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="py-2 border-t border-gray-100">
            <div className="px-4 py-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Messages directs</span>
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Nouvelle conversation"
              >
                <Plus className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            {filteredConversations.length === 0 ? (
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-gray-400">Aucune conversation</p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="mt-2 text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Demarrer une conversation
                </button>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    activeView?.type === 'conversation' && activeView.data.id === conv.id
                      ? 'bg-cyan-50 text-cyan-700 border-r-2 border-cyan-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {conv.participant_name.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      conv.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.participant_name}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.participant_role}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setShowNewConversation(true)}
            className="w-full py-2.5 text-sm text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Nouvelle conversation
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeView && headerInfo ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
              {headerInfo.icon}
              <div>
                <h3 className="font-bold text-gray-900">{headerInfo.title}</h3>
                {headerInfo.subtitle && (
                  <p className="text-sm text-gray-500">{headerInfo.subtitle}</p>
                )}
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-6 space-y-4"
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun message pour le moment</p>
                    <p className="text-xs mt-1">Envoyez le premier message !</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map(msg => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[70%]">
                          {!isOwn && (
                            <p className="text-xs font-semibold text-gray-500 mb-1">{msg.sender_name}</p>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isOwn
                              ? 'bg-cyan-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <MessageAttachments attachments={msg.attachments} />
                            )}
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment preview */}
            {attachments.length > 0 && (
              <div className="px-4 pt-3 pb-1 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {attachments.map(att => (
                    <div key={att.id} className="relative group flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                      {att.type.startsWith('image/') && att.previewUrl ? (
                        <img src={att.previewUrl} className="w-8 h-8 rounded object-cover" alt="" />
                      ) : (
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-gray-700 max-w-[120px] truncate">{att.name}</span>
                      <button
                        onClick={() => removeAttachment(att)}
                        className="p-0.5 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                  title="Attacher un fichier"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() && attachments.length === 0}
                  className="p-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-500">Bienvenue sur OKAPIA Connect</p>
              <p className="text-sm mt-1 text-gray-400 max-w-sm mx-auto">
                Selectionnez un canal ou une conversation pour commencer a discuter avec votre equipe.
              </p>
              <button
                onClick={() => setShowNewConversation(true)}
                className="mt-4 px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
              >
                Demarrer une conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onSuccess={() => { setShowCreateChannel(false); fetchChannels(); }}
        />
      )}

      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onSuccess={handleConversationCreated}
        />
      )}
    </div>
  );
}
