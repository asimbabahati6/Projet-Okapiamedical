import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface TypingUser {
  userId: string;
  fullName: string;
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
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNearBottomRef = useRef(true);

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

  // Supabase Realtime: subscribe to new messages
  useEffect(() => {
    const channelId = selectedChannel?.id;
    const conversationId = selectedConversation?.id;
    if (!channelId && !conversationId) return;

    const filterCol = channelId ? 'channel_id' : 'conversation_id';
    const filterVal = channelId || conversationId;

    const realtimeChannel = supabase
      .channel(`messages-${filterVal}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `${filterCol}=eq.${filterVal}`,
        },
        async (payload) => {
          const newRow = payload.new as Record<string, unknown>;

          // Don't re-add if we already have this message (from optimistic insert)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return prev; // will be added below after enrichment
          });

          // Fetch sender info for the new message
          const senderId = newRow.sender_id as string;
          let senderInfo = { full_name: 'Utilisateur', role: 'Utilisateur' };

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, role_id')
            .eq('id', senderId)
            .maybeSingle();

          if (profile) {
            const { data: roleData } = await supabase
              .from('roles')
              .select('name')
              .eq('id', profile.role_id)
              .maybeSingle();

            senderInfo = {
              full_name: profile.full_name || 'Utilisateur',
              role: roleData?.name || 'Utilisateur',
            };
          }

          const enrichedMessage: Message = {
            id: newRow.id as string,
            sender_id: senderId,
            content: newRow.content as string,
            created_at: newRow.created_at as string,
            sender: senderInfo,
            attachments: (newRow.attachments as Attachment[]) || undefined,
            patient_reference: newRow.patient_reference as string | undefined,
            exam_reference: newRow.exam_reference as string | undefined,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === enrichedMessage.id)) return prev;
            return [...prev, enrichedMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [selectedChannel?.id, selectedConversation?.id]);

  // Supabase Realtime: subscribe to typing indicators
  useEffect(() => {
    const channelId = selectedChannel?.id;
    const conversationId = selectedConversation?.id;
    if (!channelId && !conversationId) return;

    const filterCol = channelId ? 'typing_in_channel' : 'typing_in_conversation';
    const filterVal = channelId || conversationId;

    const typingChannel = supabase
      .channel(`typing-${filterVal}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_user_status',
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          const typingUserId = updated.user_id as string;

          if (typingUserId === user?.id) return;

          const isTypingHere =
            (channelId && updated.typing_in_channel === channelId) ||
            (conversationId && updated.typing_in_conversation === conversationId);

          setTypingUsers((prev) => {
            const without = prev.filter((u) => u.userId !== typingUserId);
            if (isTypingHere) {
              return [...without, { userId: typingUserId, fullName: '' }];
            }
            return without;
          });

          // Resolve the name asynchronously
          if (isTypingHere) {
            (async () => {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('id', typingUserId)
                .maybeSingle();

              if (profile) {
                setTypingUsers((prev) =>
                  prev.map((u) =>
                    u.userId === typingUserId
                      ? { ...u, fullName: profile.full_name }
                      : u
                  )
                );
              }
            })();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
      setTypingUsers([]);
    };
  }, [selectedChannel?.id, selectedConversation?.id, user?.id]);

  // Auto-scroll when messages change, but only if user is near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 120;
    isNearBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
        .select('id, participant_1, participant_2')
        .or(`participant_1.eq.${user?.id},participant_2.eq.${user?.id}`);

      if (error) throw error;

      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1;

          let userData: { id: string; full_name: string; role: string } | null = null;
          const { data: viewData } = await supabase
            .from('user_profiles_with_email')
            .select('id, full_name, role')
            .eq('id', otherUserId)
            .maybeSingle();

          if (viewData) {
            userData = viewData;
          } else {
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
                role: roleData?.name || 'Utilisateur',
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
              status: statusData?.status || 'offline',
            },
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const transformMessages = (data: Record<string, unknown>[]): Message[] =>
    data.map((msg) => {
      const sender = msg.sender as { full_name?: string; role?: { name?: string } } | null;
      return {
        ...(msg as unknown as Message),
        sender: {
          full_name: sender?.full_name || 'Utilisateur',
          role: sender?.role?.name || 'Utilisateur',
        },
      };
    });

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
      setMessages(transformMessages(data || []));
      // Force scroll to bottom on initial load
      isNearBottomRef.current = true;
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
      setMessages(transformMessages(data || []));
      isNearBottomRef.current = true;
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const broadcastTyping = useCallback(async () => {
    if (!user?.id) return;

    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      typing_in_channel: selectedChannel?.id || null,
      typing_in_conversation: selectedConversation?.id || null,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('chat_user_status').upsert(upsertData, { onConflict: 'user_id' });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from('chat_user_status')
        .upsert(
          { user_id: user.id, typing_in_channel: null, typing_in_conversation: null, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
    }, 3000);
  }, [user?.id, selectedChannel?.id, selectedConversation?.id]);

  const clearTyping = useCallback(async () => {
    if (!user?.id) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await supabase
      .from('chat_user_status')
      .upsert(
        { user_id: user.id, typing_in_channel: null, typing_in_conversation: null, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  }, [user?.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && currentAttachments.length === 0) return;

    const content = messageInput.trim() || 'Fichier(s) joint(s)';

    try {
      const messageData: Record<string, unknown> = {
        sender_id: user?.id,
        content,
      };

      if (selectedChannel) {
        messageData.channel_id = selectedChannel.id;
      } else if (selectedConversation) {
        messageData.conversation_id = selectedConversation.id;
      }

      if (currentAttachments.length > 0) {
        messageData.attachments = currentAttachments;
      }

      setMessageInput('');
      setCurrentAttachments([]);
      clearTyping();

      // Force scroll to bottom for own messages
      isNearBottomRef.current = true;

      const { error } = await supabase.from('chat_messages').insert(messageData);

      if (error) throw error;
      // No manual refetch needed -- Realtime subscription handles it
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    if (value.trim()) {
      broadcastTyping();
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, typeof Hash> = {
      hash: Hash,
      flask: Hash,
      pill: Hash,
      scan: Hash,
      stethoscope: Hash,
      briefcase: Hash,
      'alert-triangle': Hash,
    };
    return icons[iconName] || Hash;
  };

  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-600 bg-cyan-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50',
  };

  const statusColors: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400',
  };

  const typingLabel = typingUsers.length > 0
    ? typingUsers.length === 1
      ? `${typingUsers[0].fullName || 'Quelqu\'un'} est en train d'écrire...`
      : `${typingUsers.length} personnes écrivent...`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
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
                          setTypingUsers([]);
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
                          setTypingUsers([]);
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
                  <div className={`p-2 rounded-lg ${colorClasses[selectedChannel.color] || 'text-cyan-600 bg-cyan-50'}`}>
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
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  layout
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-2xl ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {!isOwnMessage && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{message.sender.full_name}</span>
                        <span className="text-xs text-gray-500">{message.sender.role}</span>
                      </div>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.005 }}
                      className={`px-4 py-3 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-cyan-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}

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
                    </motion.div>
                    <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingLabel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-t border-gray-100 px-6 overflow-hidden"
            >
              <div className="flex items-center gap-2 py-2">
                <div className="flex gap-1">
                  <motion.span
                    className="w-1.5 h-1.5 bg-cyan-500 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 bg-cyan-500 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 bg-cyan-500 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
                <span className="text-xs text-gray-500 italic">{typingLabel}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="space-y-3">
            <div className="flex items-end gap-3">
              <FileAttachmentUpload onAttachmentsChange={setCurrentAttachments} />

              <div className="flex-1">
                <textarea
                  value={messageInput}
                  onChange={(e) => handleInputChange(e.target.value)}
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

              <motion.button
                type="submit"
                disabled={!messageInput.trim() && currentAttachments.length === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onSuccess={async (channelId) => {
            try {
              const { data: newChannel } = await supabase
                .from('chat_channels')
                .select('*')
                .eq('id', channelId)
                .maybeSingle();

              await fetchChannels();

              if (newChannel) {
                setSelectedChannel(newChannel);
                setSelectedConversation(null);
              }
            } catch (error) {
              console.error('Error in onSuccess:', error);
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
            try {
              const { data: convData } = await supabase
                .from('chat_direct_conversations')
                .select('id, participant_1, participant_2')
                .eq('id', conversationId)
                .maybeSingle();

              if (!convData) throw new Error('Conversation not found');

              const otherUserId = convData.participant_1 === user?.id
                ? convData.participant_2
                : convData.participant_1;

              let userInfo: { id: string; full_name: string; role: string } | null = null;

              const { data: viewData } = await supabase
                .from('user_profiles_with_email')
                .select('id, full_name, role')
                .eq('id', otherUserId)
                .maybeSingle();

              if (viewData) {
                userInfo = viewData;
              } else {
                const { data: profileData } = await supabase
                  .from('user_profiles')
                  .select('id, full_name, role_id')
                  .eq('id', otherUserId)
                  .maybeSingle();

                if (profileData) {
                  const { data: roleData } = await supabase
                    .from('roles')
                    .select('name')
                    .eq('id', profileData.role_id)
                    .maybeSingle();

                  userInfo = {
                    id: profileData.id,
                    full_name: profileData.full_name,
                    role: roleData?.name || 'Utilisateur',
                  };
                }
              }

              const { data: statusData } = await supabase
                .from('chat_user_status')
                .select('status')
                .eq('user_id', otherUserId)
                .maybeSingle();

              const newConversation: DirectConversation = {
                id: conversationId,
                otherUser: {
                  id: userInfo?.id || otherUserId,
                  full_name: userInfo?.full_name || 'Utilisateur',
                  role: userInfo?.role || 'Utilisateur',
                  status: statusData?.status || 'offline',
                },
              };

              setSelectedConversation(newConversation);
              setSelectedChannel(null);

              fetchConversations().catch((err) =>
                console.error('Error refreshing conversations:', err)
              );
            } catch (error) {
              console.error('Error in onSuccess:', error);
              await fetchConversations();
            } finally {
              setShowNewConversation(false);
            }
          }}
        />
      )}
    </div>
  );
}
