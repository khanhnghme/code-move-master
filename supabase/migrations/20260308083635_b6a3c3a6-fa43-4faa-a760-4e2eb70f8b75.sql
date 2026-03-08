
-- Create meetings table
CREATE TABLE public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled',
  jitsi_room_name text NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create meeting_attendance table
CREATE TABLE public.meeting_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'absent',
  joined_at timestamptz,
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;

-- RLS for meetings
CREATE POLICY "Group members can view meetings"
  ON public.meetings FOR SELECT
  USING (is_group_member(auth.uid(), group_id) OR is_admin(auth.uid()));

CREATE POLICY "Leaders can manage meetings"
  ON public.meetings FOR ALL
  USING (is_group_leader(auth.uid(), group_id));

-- RLS for meeting_attendance
CREATE POLICY "Group members can view attendance"
  ON public.meeting_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_attendance.meeting_id
      AND (is_group_member(auth.uid(), m.group_id) OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Leaders can manage attendance"
  ON public.meeting_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_attendance.meeting_id
      AND is_group_leader(auth.uid(), m.group_id)
    )
  );

CREATE POLICY "Members can update own attendance"
  ON public.meeting_attendance FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
