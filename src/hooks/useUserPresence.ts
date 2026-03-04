import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PresenceStatus = 'online' | 'offline';

export interface UserPresence {
  status: PresenceStatus;
  userId: string;
}

export function useUserPresence(groupId?: string) {
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || !groupId) return;

    setIsConnected(false);
    setPresenceMap(new Map());

    const channelName = `presence:${groupId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: user.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<UserPresence>();
        const next = new Map<string, UserPresence>();
        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            const latestPresence = presences[presences.length - 1];
            const id = latestPresence.userId || key;
            next.set(id, {
              status: 'online',
              userId: id,
            });
          }
        });
        setPresenceMap(next);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (!newPresences || newPresences.length === 0) return;
        const presence = newPresences[newPresences.length - 1];
        const id = presence.userId || key;
        setPresenceMap((prev) => {
          const next = new Map(prev);
          next.set(id, { status: 'online', userId: id });
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const id = leftPresences?.[0]?.userId || key;
        setPresenceMap((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          try {
            await channel.track({
              status: 'online',
              userId: user.id,
            });
          } catch (error) {
            console.error('Error tracking presence:', error);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId]);

  const getPresenceStatus = useCallback(
    (userId: string): PresenceStatus => {
      return presenceMap.has(userId) ? 'online' : 'offline';
    },
    [presenceMap]
  );

  const isUserOnline = useCallback((userId: string): boolean => {
    return presenceMap.has(userId);
  }, [presenceMap]);

  return {
    presenceMap,
    getPresenceStatus,
    isUserOnline,
    isConnected,
  };
}
