import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Users, Hash, Plus, Search, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CreateChannelModal from '../../components/chat/CreateChannelModal';
import NewConversationModal from '../../components/chat/NewConversationModal';

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

export default function OkapiaConnectPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (!selectedChannel) return;

    const channel = supabase
      .channel(`okapia-messages-${selectedChannel.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${selectedChannel.id}` },
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
          };

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedChannel]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function fetchChannels() {
    const { data } = await supabase
      .from('chat_channels')
      .select('id, name, slug, description')
      .order('name');

    if (data) {
      setChannels(data as Channel[]);
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0] as Channel);
      }
    }
  }

  async function fetchMessages(channelId: string) {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, sender_id, content, created_at, sender:user_profiles!chat_messages_sender_id_fkey(full_name)')
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
        };
      }));
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannel || !user?.id) return;

    const content = messageInput.trim();
    setMessageInput('');

    await supabase.from('chat_messages').insert({
      channel_id: selectedChannel.id,
      sender_id: user.id,
      content,
    });
  }

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600" />
              OKAPIA Connect
            </h2>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
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
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {filteredChannels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors ${
                selectedChannel?.id === channel.id ? 'bg-cyan-50 text-cyan-700 border-r-2 border-cyan-600' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Hash className="w-4 h-4 opacity-50" />
              <span className="text-sm font-medium truncate">{channel.name}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setShowNewConversation(true)}
            className="w-full py-2 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg font-medium transition-colors"
          >
            + Nouvelle conversation
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                {selectedChannel.name}
              </h3>
              {selectedChannel.description && (
                <p className="text-sm text-gray-500 mt-0.5">{selectedChannel.description}</p>
              )}
            </div>

            <div
              className="flex-1 overflow-y-auto p-6 space-y-4"
              onScroll={handleScroll}
            >
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
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                  <span>en train d'écrire...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={sendMessage} className="flex items-center gap-3">
                <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Écrire dans #${selectedChannel.name}...`}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
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
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Sélectionnez un canal</p>
              <p className="text-sm mt-1">pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>

      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreated={() => { setShowCreateChannel(false); fetchChannels(); }}
        />
      )}

      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onCreated={() => setShowNewConversation(false)}
        />
      )}
    </div>
  );
}
