import React from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import type { ToastActionElement } from '@/components/ui/toast';

interface DeleteWithUndoOptions {
  /** Thông báo hiển thị sau khi xóa (ví dụ: "Đã xóa giai đoạn") */
  description: string;
  /** Hàm thực hiện xóa thật sự (gọi sau 5 giây) */
  onDelete: () => Promise<void>;
  /** Hàm hoàn tác nếu người dùng nhấn Undo (tùy chọn - nếu xóa tạm thời thì cần) */
  onUndo?: () => void;
  /** Thời gian chờ trước khi xóa vĩnh viễn (mặc định 5000ms) */
  duration?: number;
  /** Title cho toast (mặc định: "Đã xóa") */
  title?: string;
}

/**
 * HỆ THỐNG HOÀN TÁC XÓA (UNDO DELETE)
 * 
 * Quy tắc bắt buộc toàn hệ thống:
 * - Mọi thao tác xóa đều phải sử dụng hàm này
 * - Hiển thị toast với nút "Hoàn tác" trong 5 giây
 * - Chỉ xóa vĩnh viễn sau khi hết thời gian chờ
 * 
 * Cách dùng:
 * ```ts
 * deleteWithUndo({
 *   description: 'Đã xóa task "Thiết kế UI"',
 *   onDelete: async () => {
 *     await supabase.from('tasks').delete().eq('id', taskId);
 *   },
 *   onUndo: () => {
 *     // Khôi phục state UI nếu cần
 *   },
 * });
 * ```
 */
export function deleteWithUndo({
  description,
  onDelete,
  onUndo,
  duration = 5000,
  title = 'Đã xóa',
}: DeleteWithUndoOptions) {
  let cancelled = false;

  const toastInstance = toast({
    title,
    description,
    duration: duration + 500, // keep toast visible slightly longer
    action: React.createElement(
      ToastAction,
      {
        altText: 'Hoàn tác',
        onClick: () => {
          cancelled = true;
          onUndo?.();
          toast({
            title: 'Đã hoàn tác',
            description: 'Dữ liệu đã được khôi phục',
            duration: 2000,
          });
        },
      },
      'Hoàn tác'
    ) as unknown as ToastActionElement,
  });

  const timer = setTimeout(async () => {
    if (!cancelled) {
      try {
        await onDelete();
      } catch (error: any) {
        toast({
          title: 'Lỗi khi xóa',
          description: error.message || 'Không thể xóa dữ liệu',
          variant: 'destructive',
        });
        onUndo?.();
      }
    }
  }, duration);

  return {
    cancel: () => {
      cancelled = true;
      clearTimeout(timer);
      toastInstance.dismiss();
    },
  };
}
