
-- Enable FULL replica identity for realtime to work properly with UPDATE events
ALTER TABLE public.task_notes REPLICA IDENTITY FULL;
