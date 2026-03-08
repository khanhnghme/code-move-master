
-- Add external_link to meetings
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS external_link text;

-- Create meeting_messages table for realtime chat
CREATE TABLE public.meeting_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;

-- RLS: group members can view and insert messages
CREATE POLICY "Group members can view meeting messages"
  ON public.meeting_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_messages.meeting_id
      AND (is_group_member(auth.uid(), m.group_id) OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Group members can insert meeting messages"
  ON public.meeting_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_messages.meeting_id
      AND is_group_member(auth.uid(), m.group_id)
    )
  );

CREATE POLICY "Leaders can delete meeting messages"
  ON public.meeting_messages FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_messages.meeting_id
      AND is_group_leader(auth.uid(), m.group_id)
    )
  );

-- Enable realtime for meeting_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_messages;
