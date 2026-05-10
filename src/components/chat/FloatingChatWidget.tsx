import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    full_name: string;
  };
}

interface FloatingChatWidgetProps {
  channelId?: string;
  channelName?: string;
}

export default function FloatingChatWidget({ channelId, channelName = 'Général' }: FloatingChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentChannelId, setCurrentChannelId] = useState(channelId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentChannelId) {
      fetchDefaultChannel();
    }
  }, []);

  useEffect(() => {
    if (isOpen && currentChannelId) {
      fetchMessages();

      const subscription = supabase
        .channel('chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `channel_id=eq.${currentChannelId}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen, currentChannelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDefaultChannel = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('slug', 'general')
        .single();

      if (error) throw error;
      setCurrentChannelId(data.id);
    } catch (error) {
      console.error('Error fetching default channel:', error);
    }
  };

  const fetchMessages = async () => {
    if (!currentChannelId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:user_profiles!chat_messages_sender_id_fkey(full_name)
        `)
        .eq('channel_id', currentChannelId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChannelId || !user?.id) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: currentChannelId,
          sender_id: user.id,
          content: messageInput.trim()
        });

      if (error) throw error;

      setMessageInput('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-700 text-white rounded-full shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 animate-bounce"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm">OKAPIA Connect</h3>
            <p className="text-xs text-cyan-100">#{channelName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-cyan-600 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-cyan-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-[480px] overflow-y-auto p-4 space-y-3">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%]`}>
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        {message.sender.full_name}
                      </p>
                    )}
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-cyan-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
