-- Enable realtime for chat_notifications table
-- Required for the ChatNotificationBell component to receive live updates
ALTER PUBLICATION supabase_realtime ADD TABLE chat_notifications;
