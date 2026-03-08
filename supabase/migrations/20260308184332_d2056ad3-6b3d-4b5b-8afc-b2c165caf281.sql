
CREATE TABLE public.feedback_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.feedbacks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('useful', 'not_useful')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feedback_id, user_id)
);

ALTER TABLE public.feedback_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback reactions"
ON public.feedback_reactions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can manage own reactions"
ON public.feedback_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reactions"
ON public.feedback_reactions FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions"
ON public.feedback_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());
