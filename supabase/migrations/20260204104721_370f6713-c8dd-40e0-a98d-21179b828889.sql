-- Add max_file_size and extended_deadline columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS max_file_size BIGINT DEFAULT 10485760,
ADD COLUMN IF NOT EXISTS extended_deadline TIMESTAMP WITH TIME ZONE DEFAULT NULL;