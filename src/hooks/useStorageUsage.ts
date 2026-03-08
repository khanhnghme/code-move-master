import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_STORAGE_LIMIT_MB = 200;

interface StorageUsage {
  usedBytes: number;
  usedMB: number;
  limitMB: number;
  limitBytes: number;
  remainingBytes: number;
  remainingMB: number;
  isOverLimit: boolean;
  usagePercent: number;
  isLoading: boolean;
}

export function useStorageUsage(userId: string | undefined, storageLimitMb?: number | null): StorageUsage {
  const [usedBytes, setUsedBytes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const limitMB = storageLimitMb === null ? Infinity : (storageLimitMb ?? DEFAULT_STORAGE_LIMIT_MB);
  const limitBytes = limitMB === Infinity ? Infinity : limitMB * 1024 * 1024;

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchUsage = async () => {
      setIsLoading(true);
      try {
        // Sum file sizes from submission_history for this user
        const { data, error } = await supabase
          .from('submission_history')
          .select('file_size')
          .eq('user_id', userId)
          .not('file_size', 'is', null);

        if (error) {
          console.error('Error fetching storage usage:', error);
          setUsedBytes(0);
        } else {
          const total = (data || []).reduce((sum, row) => sum + (row.file_size || 0), 0);
          setUsedBytes(total);
        }
      } catch (err) {
        console.error('Storage usage error:', err);
        setUsedBytes(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, [userId]);

  const usedMB = usedBytes / (1024 * 1024);
  const remainingBytes = Math.max(0, limitBytes - usedBytes);
  const remainingMB = remainingBytes / (1024 * 1024);
  const isOverLimit = usedBytes >= limitBytes;
  const usagePercent = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  return {
    usedBytes,
    usedMB,
    limitMB,
    limitBytes,
    remainingBytes,
    remainingMB,
    isOverLimit,
    usagePercent,
    isLoading,
  };
}
