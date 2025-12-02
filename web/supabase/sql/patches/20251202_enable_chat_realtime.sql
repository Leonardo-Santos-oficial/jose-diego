-- Enable Realtime for chat tables
-- This is required for postgres_changes subscriptions to work

-- Add chat_messages to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END$$;

-- Add chat_threads to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chat_threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
  END IF;
END$$;

-- Set REPLICA IDENTITY to FULL for better change tracking
-- This ensures all columns are available in the change payload
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_threads REPLICA IDENTITY FULL;
