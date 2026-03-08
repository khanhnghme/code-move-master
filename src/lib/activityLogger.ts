import { supabase } from '@/integrations/supabase/client';

interface LogActivityParams {
  userId: string;
  userName: string;
  action: string;
  actionType: 'member' | 'task' | 'stage' | 'resource' | 'score' | 'project' | 'setting' | 'system';
  description: string;
  groupId?: string;
  metadata?: Record<string, any>;
}

export async function logActivity({
  userId,
  userName,
  action,
  actionType,
  description,
  groupId,
  metadata,
}: LogActivityParams) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      user_name: userName,
      action,
      action_type: actionType,
      description,
      group_id: groupId || null,
      metadata: metadata || null,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
