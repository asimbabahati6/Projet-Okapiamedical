import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ChatNotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCount();

    const channel = supabase
      .channel(`chat-notif-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_notifications', filter: `user_id=eq.${user.id}` },
        () => { fetchUnreadCount(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('chat_notifications')
        .select('unread_count')
        .eq('user_id', user.id)
        .gt('unread_count', 0);

      if (error) throw error;

      const total = (data || []).reduce((sum, notif) => sum + (notif.unread_count || 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <button
      onClick={() => navigate('/staff/okapia-connect')}
      className="relative p-2 text-gray-600 hover:text-cyan-600 hover:bg-gray-100 rounded-lg transition-colors"
      title="OKAPIA Connect"
    >
      <MessageSquare className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
