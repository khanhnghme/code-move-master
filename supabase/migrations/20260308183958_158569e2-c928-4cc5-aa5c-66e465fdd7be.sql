
ALTER TABLE public.feedback_comments 
ADD COLUMN reply_to_id uuid REFERENCES public.feedback_comments(id) ON DELETE SET NULL;
