/*
# Enable Realtime for invoices table

Adds the `invoices` table to the Supabase Realtime publication so that
INSERT and UPDATE events are broadcast to subscribed clients.
This is needed for the caissière's real-time payment queue.

No schema changes. No RLS changes.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'invoices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
  END IF;
END $$;
